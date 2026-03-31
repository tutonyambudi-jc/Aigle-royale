import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.toLowerCase()

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    const start = startOfDay(new Date())
    const end = endOfDay(new Date())

    try {
        const bookings = await prisma.booking.findMany({
            where: {
                trip: {
                    departureTime: {
                        gte: start,
                    },
                    isActive: true,
                },
                status: 'CONFIRMED',
                OR: [
                    { ticketNumber: { contains: query } },
                    { qrCode: { contains: query } },
                    { passengerName: { contains: query } },
                    { passengerPhone: { contains: query } },
                    { seat: { seatNumber: { contains: query } } },
                    { user: { firstName: { contains: query } } },
                    { user: { lastName: { contains: query } } },
                    { user: { passportOrIdNumber: { contains: query } } },
                    { user: { phone: { contains: query } } },
                ]
            },
            include: {
                trip: {
                    include: {
                        route: {
                            select: { origin: true, destination: true }
                        },
                        bus: {
                            select: { name: true }
                        }
                    }
                }
            },
            take: 5
        })

        const results = bookings.map(b => ({
            tripId: b.tripId,
            passengerId: b.id,
            departureTime: b.trip.departureTime,
            description: `${b.passengerName} (${b.ticketNumber}) - ${b.trip.route.origin} -> ${b.trip.route.destination}`
        }))

        return NextResponse.json(results)
    } catch (error) {
        console.error('Global search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
