import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeSearchText } from '@/lib/search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const date = searchParams.get('date')

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const searchDate = new Date(date)
    const startOfDay = new Date(searchDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(searchDate)
    endOfDay.setHours(23, 59, 59, 999)

    const trips = await prisma.trip.findMany({
      where: {
        isActive: true,
        departureTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        route: {
          isActive: true,
        },
      },
      include: {
        bus: true,
        route: {
          include: {
            stops: {
              include: {
                stop: {
                  include: { city: true }
                }
              }
            }
          }
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    })

    // SQLite: Prisma ne supporte pas `mode: 'insensitive'` => filtrage côté serveur (robuste)
    const o = normalizeSearchText(origin)
    const d = normalizeSearchText(destination)
    const filtered = trips.filter((t: any) => {
      const ro = normalizeSearchText(t.route?.origin || '')
      const rd = normalizeSearchText(t.route?.destination || '')
      return ro.includes(o) && rd.includes(d)
    }).map((t: any) => ({
      ...t,
      stops: t.route?.stops?.map((rs: any) => ({
        id: rs.stop.id,
        name: rs.stop.name,
        city: rs.stop.city
      })) || []
    }))

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Trip search error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
