import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'



function calculatePointsFromAmount(amountXof: number): number {
  // Règle simple: 1 point par tranche de 1000 FC payés
  return Math.max(0, Math.floor(amountXof / 1000))
}

function getTier(points: number): string {
  if (points >= 500) return 'PLATINUM'
  if (points >= 250) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { method } = body

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: {
        trip: true,
        payment: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    // Autoriser le propriétaire OU l'agent vendeur OU le vendeur en agence
    if (
      booking.userId !== session.user.id &&
      booking.agentId !== session.user.id &&
      booking.agencyStaffId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    if (booking.payment && booking.payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà payée' },
        { status: 400 }
      )
    }

    const isStaffActor = ['AGENT', 'SUPER_AGENT', 'AGENCY_STAFF', 'ADMINISTRATOR', 'SUPERVISOR'].includes(
      session.user.role
    )
    const cashIsPaidNow = method === 'CASH' && isStaffActor

    // Si c'est un client online qui paie en agence (CASH), on met une deadline de 2h
    // Sinon (staff ou paiement immédiat), pas de deadline
    const paymentDeadline = (method === 'CASH' && !isStaffActor)
      ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 heures
      : null

    // Créer ou mettre à jour le paiement
    const paymentData = {
      bookingId: booking.id,
      amount: booking.totalPrice || booking.trip.price,
      method: method,
      status: method === 'CASH' ? (cashIsPaidNow ? 'PAID' : 'PENDING') : 'PAID',
      paidAt: method === 'CASH' ? (cashIsPaidNow ? new Date() : null) : new Date(),
      paymentDeadline,
    }

    let payment
    if (booking.payment) {
      payment = await prisma.payment.update({
        where: { id: booking.payment.id },
        data: paymentData,
      })
    } else {
      payment = await prisma.payment.create({
        data: paymentData,
      })
    }

    // Mettre à jour le statut de la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: payment.status === 'PAID' ? 'CONFIRMED' : 'PENDING',
      },
    })

    // Commission agent: créer automatiquement lors d'un paiement confirmé (idempotent)
    if (payment.status === 'PAID' && booking.agentId) {
      // Récupérer le taux de commission de l'agent
      const agent = await prisma.user.findUnique({
        where: { id: booking.agentId },
        select: { commissionRate: true },
      })
      const agentCommissionRate = agent?.commissionRate || 10
      const commissionAmount = (payment.amount * agentCommissionRate) / 100

      if (commissionAmount > 0) {
        try {
          await prisma.commission.create({
            data: {
              agentId: booking.agentId,
              bookingId: booking.id,
              amount: commissionAmount,
              percentage: agentCommissionRate,
              status: 'PENDING',
            },
          })
        } catch (e) {
          // unique constraint => déjà créé, ok
        }
      }
    }

    // Fidélité: attribuer des points uniquement pour les achats CLIENT (pas pour les ventes staff)
    if (payment.status === 'PAID' && session.user.role === 'CLIENT') {
      const points = calculatePointsFromAmount(payment.amount)

      if (points > 0) {
        const existing = await prisma.loyaltyTransaction.findUnique({
          where: { bookingId: booking.id },
          select: { id: true },
        })

        if (!existing) {
          await prisma.$transaction(async (tx) => {
            await tx.loyaltyTransaction.create({
              data: {
                userId: session.user.id,
                bookingId: booking.id,
                points,
                type: 'EARN',
                reason: 'Paiement de réservation',
              },
            })

            const updatedUser = await tx.user.update({
              where: { id: session.user.id },
              data: {
                loyaltyPoints: { increment: points },
              },
              select: { loyaltyPoints: true },
            })

            await tx.user.update({
              where: { id: session.user.id },
              data: {
                loyaltyTier: getTier(updatedUser.loyaltyPoints),
              },
            })
          })
        }
      }
    }

    // Si paiement en agence, générer un code de transaction
    if (method === 'CASH') {
      const transactionId = `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId },
      })
    }

    // Send Notification if Paid
    if (updatedBooking.status === 'CONFIRMED') {
      try {
        const { NotificationService } = await import('@/lib/notifications')
        const templates = NotificationService.templates.paymentConfirmation(updatedBooking, updatedBooking.ticketNumber)

        if (updatedBooking.passengerEmail) {
          await NotificationService.sendEmail({
            to: updatedBooking.passengerEmail,
            subject: templates.subject,
            html: templates.html
          })
        }
        if (updatedBooking.passengerPhone) {
          await NotificationService.sendSMS({
            to: updatedBooking.passengerPhone,
            message: templates.sms
          })
        }
      } catch (e) {
        console.error('Notification error:', e)
      }
    }

    return NextResponse.json(
      {
        success: true,
        paymentId: payment.id,
        bookingStatus: updatedBooking.status,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors du paiement',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
