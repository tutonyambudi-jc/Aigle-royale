import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  const date = dateParam ? new Date(dateParam) : new Date()
  const start = startOfDay(date)
  const end = endOfDay(date)

  try {
    const trips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: start,
          lte: end,
        },
        isActive: true,
      },
      include: {
        route: {
          select: { origin: true, destination: true }
        },
        bus: {
          select: { name: true, plateNumber: true, capacity: true, seatType: true }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: {
        departureTime: 'asc',
      },
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error('Error fetching trips for check-in:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}
