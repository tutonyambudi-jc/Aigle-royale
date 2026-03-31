import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/utils'
import { buildBookingQrPayload, bookingQrToDataUrl } from '@/lib/booking-qr-payload'
import { calcBaggageExtrasXof } from '@/lib/baggage'
import { getServiceFeeConfig, computeServiceFee } from '@/lib/service-fee'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      tripId,
      seatId,
      passengerName,
      passengerGender,
      passengerAddress,
      passengerPhone,
      passengerEmail,
      passengerType,
      passengerAge,
      hasDisability,
      boardingStopId,
      alightingStopId,
      agentId,
      passengers,
    } = body

    const passengerList: Array<{
      seatId: string
      passengerName: string
      passengerGender?: string
      passengerAddress?: string
      passengerPhone?: string
      passengerEmail?: string
      passengerType?: string
      passengerAge?: number
      hasDisability?: boolean
      boardingStopId?: string
      alightingStopId?: string
      extraBaggagePieces?: number
      extraBaggageOverweightKg?: number
    }> = Array.isArray(passengers)
        ? passengers
        : [
          {
            seatId,
            passengerName,
            passengerGender,
            passengerAddress,
            passengerPhone,
            passengerEmail,
            passengerType,
            passengerAge,
            hasDisability,
            boardingStopId,
            alightingStopId,
          },
        ]

    // Validation
    if (!tripId || passengerList.length === 0) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    for (const p of passengerList) {
      if (!p?.seatId || !p?.passengerName) {
        return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
      }
    }

    // Vérifier unicité des sièges
    const uniqueSeatIds = new Set(passengerList.map((p) => p.seatId))
    if (uniqueSeatIds.size !== passengerList.length) {
      return NextResponse.json({ error: 'Sièges dupliqués' }, { status: 400 })
    }

    // Vérifier que le trajet existe et est actif
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
        },
        bus: true,
      },
    })

    if (!trip || !trip.isActive) {
      return NextResponse.json(
        { error: 'Trajet non disponible' },
        { status: 400 }
      )
    }

    // --- TIME RESTRICTION LOGIC ---
    const now = new Date()
    const departureTime = new Date(trip.departureTime)
    const role = session.user.role

    if (role === 'SUPER_AGENT' || role === 'ADMINISTRATOR' || role === 'SUPERVISOR') {
      // Super Agent: Up to 10 minutes before boarding time
      const boardingMinutesBefore = (trip as any).boardingMinutesBefore || 30
      const boardingTime = new Date(departureTime.getTime() - boardingMinutesBefore * 60000)
      const limitTime = new Date(boardingTime.getTime() - 10 * 60000) // 10 mins before boarding

      if (now > limitTime) {
        return NextResponse.json(
          { error: `Réservation fermée. Pour les Super Agents, la limite est de 10 minutes avant l'embarquement (${boardingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).` },
          { status: 400 }
        )
      }
    } else {
      // Clients and regular Agents: Up to 1 hour before departure
      const limitTime = new Date(departureTime.getTime() - 60 * 60000)

      if (now > limitTime) {
        return NextResponse.json(
          { error: 'La réservation en ligne ferme 1 heure avant le départ. Veuillez vous rendre en agence ou contacter un Super Agent.' },
          { status: 400 }
        )
      }
    }
    // ----------------------------

    // Vérifier la disponibilité globale
    if (trip.bookings.length + passengerList.length > trip.bus.capacity) {
      return NextResponse.json(
        { error: 'Plus de places disponibles' },
        { status: 400 }
      )
    }

    // Déterminer le userId et agentId
    let bookingUserId = session.user.id
    let bookingAgentId: string | null = null
    let bookingAgencyStaffId: string | null = null

    if (session.user.role === 'AGENT') {
      // Vente via agent agréé
      bookingAgentId = session.user.id
      bookingUserId = session.user.id
    } else if (session.user.role === 'AGENCY_STAFF' || session.user.role === 'SUPER_AGENT') {
      // Vente en agence (personnel/super agent)
      bookingAgencyStaffId = session.user.id
      bookingUserId = session.user.id
    }

    const serviceFeeConfig = await getServiceFeeConfig()

    // Créer 1 réservation par passager (par ticket) et les regrouper dans un BookingGroup
    const created = await prisma.$transaction(async (tx) => {
      const results: Array<{ id: string; ticketNumber: string }> = []
      let totalAmount = 0

      // Create the BookingGroup first
      const bookingGroup = await tx.bookingGroup.create({
        data: {
          userId: bookingUserId,
          totalAmount: 0, // Will be updated after bookings are created
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      })

      for (const p of passengerList) {
        // Vérifier que le siège est disponible (par trajet)
        const seat = await tx.seat.findUnique({
          where: { id: p.seatId },
          select: {
            id: true,
            busId: true,
            isAvailable: true,
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'PENDING'] },
                tripId: tripId,
              },
              select: { id: true },
            },
          },
        })

        if (!seat || seat.busId !== trip.busId || !seat.isAvailable || seat.bookings.length > 0) {
          throw new Error('SEAT_NOT_AVAILABLE')
        }

        const ticketNumber = generateTicketNumber()
        const extraPieces = Number((p as any)?.extraBaggagePieces)
        const overweightKg = Number((p as any)?.extraBaggageOverweightKg)
        const baggageExtras = calcBaggageExtrasXof({ extraPieces, overweightKg })

        // Get pricing rule for passenger type
        const passengerTypeValue = p.passengerType || 'ADULT'
        const pricingRule = await tx.passengerPricing.findUnique({
          where: { passengerType: passengerTypeValue },
        })

        // Calculate price with discount
        const basePrice = trip.price
        const discountPercent = pricingRule?.discountPercent || 0
        const discountAmount = (basePrice * discountPercent) / 100
        const ticketPrice = basePrice - discountAmount
        const subtotal = ticketPrice + baggageExtras
        const serviceFeeAmount = computeServiceFee(subtotal, serviceFeeConfig)
        const bookingTotalPrice = subtotal + serviceFeeAmount

        totalAmount += bookingTotalPrice

        const booking = await tx.booking.create({
          data: {
            bookingGroupId: bookingGroup.id,
            tripId,
            userId: bookingUserId,
            seatId: p.seatId,
            passengerName: p.passengerName,
            passengerGender: p.passengerGender || null,
            passengerType: passengerTypeValue,
            passengerAge: p.passengerAge || null,
            hasDisability: p.hasDisability || false,
            passengerAddress: p.passengerAddress || null,
            passengerPhone: p.passengerPhone || null,
            passengerEmail: p.passengerEmail || null,
            boardingStopId: p.boardingStopId || null,
            alightingStopId: p.alightingStopId || null,
            extraBaggagePieces: Number.isFinite(extraPieces) ? Math.max(0, Math.floor(extraPieces)) : 0,
            extraBaggageOverweightKg: Number.isFinite(overweightKg) ? Math.max(0, overweightKg) : 0,
            extrasTotal: baggageExtras,
            ticketNumber,
            status: 'PENDING',
            agentId: bookingAgentId,
            agencyStaffId: bookingAgencyStaffId,
            basePrice: basePrice,
            discountAmount: discountAmount,
            totalPrice: bookingTotalPrice,
          },
          select: { id: true, ticketNumber: true },
        })

        const qrPayload = buildBookingQrPayload({
          bookingId: booking.id,
          bookingGroupId: bookingGroup.id,
          ticketNumber: booking.ticketNumber,
          tripId: trip.id,
          passengerName: p.passengerName,
          bookingStatus: 'PENDING',
          paymentStatus: 'PENDING',
        })
        const qrCode = await bookingQrToDataUrl(qrPayload)
        await tx.booking.update({
          where: { id: booking.id },
          data: { qrCode },
        })

        results.push({ id: booking.id, ticketNumber: booking.ticketNumber })
      }

      // Update the BookingGroup with the total amount
      await tx.bookingGroup.update({
        where: { id: bookingGroup.id },
        data: { totalAmount },
      })

      return { results, bookingGroupId: bookingGroup.id }
    })

    // Dispatch Notifications (Async - don't block response)
    // We send to each passenger if email/phone provided, or to the booker? 
    // Logic: Send to each passenger individually if info available.
    created.results.forEach(async (b) => {
      // We need to fetch booking details to get email/phone if not in 'created'
      // Optimally, we pass the data from loop. But 'created' only has id/ticket.
      // Let's fire and forget based on input? Or just Log for now.

      // Better: Retrieve booking with passenger info to send notification.
      try {
        const fullBooking = await prisma.booking.findUnique({
          where: { id: b.id },
          include: { trip: { include: { route: true } } }
        })

        if (fullBooking) {
          const { NotificationService } = await import('@/lib/notifications')
          const templates = NotificationService.templates.bookingConfirmation(fullBooking, fullBooking.ticketNumber)

          if (fullBooking.passengerEmail) {
            await NotificationService.sendEmail({
              to: fullBooking.passengerEmail,
              subject: templates.subject,
              html: templates.html
            })
          }
          if (fullBooking.passengerPhone) {
            await NotificationService.sendSMS({
              to: fullBooking.passengerPhone,
              message: templates.sms
            })
          }
        }
      } catch (err) {
        console.error('Notification error:', err)
      }
    })

    return NextResponse.json(
      {
        bookingGroupId: created.bookingGroupId,
        bookingId: created.results[0]?.id,
        id: created.results[0]?.id, // compat: certains écrans attendent `id`
        ticketNumber: created.results[0]?.ticketNumber,
        bookingIds: created.results.map((b) => b.id),
        ticketNumbers: created.results.map((b) => b.ticketNumber),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Booking error:', error)
    if (error instanceof Error && error.message === 'SEAT_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'Siège non disponible' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la réservation' },
      { status: 500 }
    )
  }
}
