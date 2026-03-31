import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const trips = await prisma.trip.findMany({
      orderBy: { departureTime: 'desc' },
      include: {
        bus: { include: { company: true } },
        route: { include: { originCity: true, destinationCity: true } },
        stopovers: { include: { stop: { include: { city: true } } }, orderBy: { order: 'asc' } },
      },
      take: 100,
    })
    return NextResponse.json(trips)
  } catch (error: any) {
    console.error('Admin trips list error:', error)
    return NextResponse.json({ error: `Erreur liste: ${error.message || 'Erreur inconnue'}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const busId = typeof body?.busId === 'string' ? body.busId : ''
    const routeId = typeof body?.routeId === 'string' ? body.routeId : ''
    const departureTime = typeof body?.departureTime === 'string' ? new Date(body.departureTime) : null
    const arrivalTime = typeof body?.arrivalTime === 'string' ? new Date(body.arrivalTime) : null
    const price = Number(body?.price)
    const boardingMinutesBefore = Number(body?.boardingMinutesBefore) || 30
    const promoActive = body?.promoActive === true
    const promoMode = typeof body?.promoMode === 'string' ? body.promoMode : null
    const promoPrice = body?.promoPrice != null ? Number(body.promoPrice) : null
    const promoDays = body?.promoDays ?? null
    const promotionPercentage = Number(body?.promotionPercentage) || 0
    const isRecurring = body?.isRecurring === true

    // For recurring trips, arrivalTime can be null (calculated from route duration)
    // For single trips, arrivalTime is required
    const errors = []
    if (!busId) errors.push('Bus requis')
    if (!routeId) errors.push('Route requise')
    if (!departureTime) errors.push('Date de départ requise')
    if (!Number.isFinite(price)) errors.push('Prix invalide')

    if (errors.length > 0) {
      return NextResponse.json({ error: `Données manquantes: ${errors.join(', ')}` }, { status: 400 })
    }

    if (!isRecurring && !arrivalTime) {
      return NextResponse.json({ error: 'Heure d\'arrivée requise pour un trajet simple' }, { status: 400 })
    }

    const bus = await prisma.bus.findUnique({ where: { id: busId }, select: { id: true, capacity: true } })
    if (!bus) return NextResponse.json({ error: 'Bus introuvable' }, { status: 400 })

    if (body.isRecurring && body.recurrence) {
      // Logic for recurring trips
      const { endDate, days, time } = body.recurrence
      const start = new Date(departureTime!)
      const end = new Date(endDate)

      // Validation
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || !time) {
        return NextResponse.json({ error: 'Dates ou heure invalides pour la récurrence' }, { status: 400 })
      }

      const generatedTrips = []
      const current = new Date(start)
      const [hours, minutes] = time.split(':').map(Number)

      // Loop day by day
      while (current <= end) {
        // days: array of integers (0=Dim...6=Sam or 1-7, based on what we sent). 
        // In UI we sent 1=Lun...6=Sam, 0=Dim which matches JS getDay() exactly except 0 is Sun.
        // JS getDay(): 0=Sun, 1=Mon...6=Sat.
        const currentDayIndex = current.getDay()

        if (days.includes(currentDayIndex)) {
          // Create a specific departure date
          const tripStart = new Date(current)
          tripStart.setHours(hours, minutes, 0, 0)

          // Calculate arrival based on duration if we had it, OR rough estimate, OR simplest: arrival = departure + (originalArrival - originalDeparture)
          // But 'originalArrival' might not be set in UI for recurring.
          // Let's assume a default duration or we should have asked for duration in UI.
          // For now, let's say 4h duration default if not calculable, OR use the duration from the Route if available?
          // Better: user usually inputs departure/arrival in Single mode. In Recurring mode we only asked for departure Time. 
          // We should validly calculate arrival.

          // OPTION: Fetch Route duration? 
          // We don't have it easily here without fetching Route. 
          // Let's fetch Route first.

          // Let's restart the loop logic after fetching route.
        }
        current.setDate(current.getDate() + 1)
      }

      // We need to fetch route duration to calculate arrival time properly
      const route = await prisma.route.findUnique({ where: { id: routeId } })
      const durationHours = route?.duration || 4 // Default 4h if not set

      // Reset current for actual generation
      current.setTime(start.getTime())

      while (current <= end) {
        const currentDayIndex = current.getDay()
        if (days.includes(currentDayIndex)) {
          const tripStart = new Date(current)
          tripStart.setHours(hours, minutes, 0, 0)

          const tripEnd = new Date(tripStart)
          tripEnd.setHours(tripEnd.getHours() + durationHours)

          generatedTrips.push({
            busId,
            routeId,
            departureTime: tripStart,
            arrivalTime: tripEnd,
            price,
            promoActive,
            promoMode,
            promoPrice,
            promoDays: promoDays ? JSON.stringify(promoDays) : null,
            boardingMinutesBefore,
            promotionPercentage,
            availableSeats: bus.capacity,
            isActive: true
          })
        }
        current.setDate(current.getDate() + 1)
      }

      if (generatedTrips.length > 0) {
        await prisma.trip.createMany({ data: generatedTrips })
      }

      return NextResponse.json({ success: true, count: generatedTrips.length }, { status: 201 })

    }

    // Default SINGLE trip logic
    const trip = await prisma.trip.create({
      data: {
        busId,
        routeId,
        departureTime: departureTime!,
        arrivalTime: arrivalTime!,
        price,
        promoActive,
        promoMode,
        promoPrice,
        promoDays: promoDays ? JSON.stringify(promoDays) : null,
        boardingMinutesBefore,
        promotionPercentage,
        availableSeats: bus.capacity,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, tripId: trip.id }, { status: 201 })
  } catch (error: any) {
    console.error('Admin trip create error:', error)
    return NextResponse.json({ error: `Erreur création: ${error.message || 'Erreur inconnue'}` }, { status: 500 })
  }
}

