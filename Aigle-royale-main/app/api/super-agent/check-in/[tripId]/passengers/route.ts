import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const p = await params
    try {
        const sortedBookings = await prisma.booking.findMany({
            where: {
                tripId: p.tripId,
                status: 'CONFIRMED',
            },
            include: {
                seat: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        passportOrIdNumber: true,
                        birthDate: true,
                        phone: true,
                    }
                },
            },
            orderBy: [
                { seat: { seatNumber: 'asc' } }
            ]
        })

        return NextResponse.json(sortedBookings)
    } catch (error) {
        console.error('Error fetching passengers:', error)
        return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 })
    }
}
