import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { method } = await request.json()

    if (!method) {
      return NextResponse.json(
        { error: 'Méthode de paiement requise' },
        { status: 400 }
      )
    }

    const bookingGroup = await prisma.bookingGroup.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            trip: {
              include: {
                route: true
              }
            }
          }
        },
        payment: true
      }
    })

    if (!bookingGroup) {
      return NextResponse.json(
        { error: 'Groupe de réservations non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur a le droit de payer
    if (bookingGroup.userId !== session.user.id && session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier si déjà payé
    if (bookingGroup.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Ce groupe de réservations est déjà payé' },
        { status: 400 }
      )
    }

    // Create or update payment
    const payment = await prisma.payment.upsert({
      where: { bookingGroupId: bookingGroup.id },
      create: {
        bookingGroupId: bookingGroup.id,
        amount: bookingGroup.totalAmount,
        method,
        status: method === 'CASH' ? 'PENDING' : 'PAID',
        paidAt: method === 'CASH' ? null : new Date(),
        paymentDeadline: method === 'CASH' ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null, // 2 hours
      },
      update: {
        method,
        status: method === 'CASH' ? 'PENDING' : 'PAID',
        paidAt: method === 'CASH' ? null : new Date(),
      },
    })

    // Update booking group status
    await prisma.bookingGroup.update({
      where: { id: bookingGroup.id },
      data: {
        paymentStatus: method === 'CASH' ? 'PENDING' : 'PAID',
        status: method === 'CASH' ? 'PENDING' : 'CONFIRMED',
      },
    })

    // Update all bookings in the group
    await prisma.booking.updateMany({
      where: { bookingGroupId: bookingGroup.id },
      data: {
        status: method === 'CASH' ? 'PENDING' : 'CONFIRMED',
      },
    })

    // Send notifications
    if (method !== 'CASH') {
      const { NotificationService } = await import('@/lib/notifications')
      
      for (const booking of bookingGroup.bookings) {
        try {
          const templates = NotificationService.templates.bookingConfirmation(booking, booking.ticketNumber)

          if (booking.passengerEmail) {
            await NotificationService.sendEmail({
              to: booking.passengerEmail,
              subject: templates.subject,
              html: templates.html
            })
          }

          if (booking.passengerPhone) {
            await NotificationService.sendSMS({
              to: booking.passengerPhone,
              message: templates.sms
            })
          }
        } catch (err) {
          console.error('Notification error for booking:', booking.id, err)
        }
      }
    }

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
