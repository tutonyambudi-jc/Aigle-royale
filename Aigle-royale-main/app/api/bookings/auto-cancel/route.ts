import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldCancelBooking } from '@/lib/booking-utils'

/**
 * API endpoint to automatically cancel expired unpaid bookings
 * Can be called manually or by a cron job
 */
export async function POST() {
    try {
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
        const cancelledIds = []
        for (const booking of bookingsToCancel) {
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: 'Délai de paiement dépassé (annulation automatique)'
                }
            })
            cancelledIds.push(booking.id)
        }

        return NextResponse.json({
            success: true,
            message: `${cancelledIds.length} réservation(s) annulée(s)`,
            cancelledBookings: cancelledIds,
            totalChecked: pendingBookings.length
        })
    } catch (error) {
        console.error('Error in auto-cancel:', error)
        return NextResponse.json(
            { success: false, error: 'Erreur lors de l\'annulation automatique' },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint to check which bookings would be cancelled without actually cancelling them
 */
export async function GET() {
    try {
        const pendingBookings = await prisma.booking.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { payment: null },
                    { payment: { status: 'PENDING' } }
                ]
            },
            include: {
                trip: {
                    include: {
                        route: true
                    }
                },
                payment: true
            }
        })

        const bookingsToCancel = pendingBookings.filter(booking => shouldCancelBooking(booking))

        return NextResponse.json({
            totalPending: pendingBookings.length,
            toCancel: bookingsToCancel.length,
            bookings: bookingsToCancel.map(b => ({
                id: b.id,
                ticketNumber: b.ticketNumber,
                passengerName: b.passengerName,
                route: `${b.trip.route.origin} → ${b.trip.route.destination}`,
                createdAt: b.createdAt,
                departureTime: b.trip.departureTime
            }))
        })
    } catch (error) {
        console.error('Error checking bookings:', error)
        return NextResponse.json(
            { success: false, error: 'Erreur lors de la vérification' },
            { status: 500 }
        )
    }
}
