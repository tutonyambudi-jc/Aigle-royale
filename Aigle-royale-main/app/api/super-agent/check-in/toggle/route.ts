import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { bookingId, checked, baggageCount, baggageWeight, checkInNotes } = await request.json()

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                checkedInAt: checked ? new Date() : null,
                baggageCount: checked ? (baggageCount || 0) : 0,
                baggageWeight: checked ? (baggageWeight || 0) : 0,
                checkInNotes: checkInNotes || null,
            },
        })

        return NextResponse.json(updatedBooking)
    } catch (error: any) {
        console.error('Error toggling check-in:', error)
        if (error.code === 'P2003') {
            console.error('Foreign Key Constraint failed field:', error.meta?.field_name)
        }
        return NextResponse.json({
            error: 'Failed to toggle check-in',
            details: error.message,
            code: error.code
        }, { status: 500 })
    }
}
