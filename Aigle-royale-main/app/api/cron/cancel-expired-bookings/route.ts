import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldCancelBooking } from '@/lib/booking-utils'
import { resolveCronSecret } from '@/lib/cron-secret'

/**
 * Cron job endpoint to automatically cancel expired bookings
 * Should be called every 15 minutes by a cron service (e.g., Vercel Cron, external service)
 * 
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cancel-expired-bookings",
 *     "schedule": "0,15,30,45 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
    try {
        const secret = resolveCronSecret()
        if (!secret.ok) {
            return NextResponse.json({ error: secret.message }, { status: secret.status })
        }

        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${secret.secret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch all PENDING bookings with unpaid or pending payments
        const pendingBookings = await prisma.booking.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { payment: null },
                    { payment: { status: 'PENDING' } }
                ]
            },
            include: {
                trip: true,
                payment: true
            }
        })

        const bookingsToCancel = pendingBookings.filter(booking => shouldCancelBooking(booking))

        // Cancel expired bookings
        const results = await Promise.all(
            bookingsToCancel.map(booking =>
                prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: 'CANCELLED' }
                })
            )
        )

        console.log(`[CRON] Cancelled ${results.length} expired bookings`)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            cancelledCount: results.length,
            totalChecked: pendingBookings.length
        })
    } catch (error) {
        console.error('[CRON] Error cancelling expired bookings:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
