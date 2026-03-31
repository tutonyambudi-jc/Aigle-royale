import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: p.id },
      include: {
        bus: {
          include: {
            seats: {
              include: {
                bookings: {
                  where: {
                    status: { in: ['CONFIRMED', 'PENDING'] },
                  },
                },
              },
            },
          },
        },
        route: true,
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trajet introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Trip fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
