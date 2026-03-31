'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomBytes } from 'crypto'

async function generateUniqueVoucherCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const part = randomBytes(4).toString('hex').toUpperCase()
    const code = `BV-${part}`
    const existing = await prisma.travelVoucher.findUnique({ where: { code } })
    if (!existing) return code
  }
  return `BV-${randomBytes(6).toString('hex').toUpperCase()}`
}

export async function validateBooking(bookingId: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR')) {
    return { error: 'Non autorisé' }
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        // Si c'est validé par admin, on pourrait vouloir noter qui l'a fait, 
        // mais le modèle actuel n'a pas de champ "validatedBy" explicite à part agencyStaffId/agentId si c'est une vente.
        // On laisse comme ça pour l'instant.
      },
    })

    revalidatePath('/admin/bookings')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Failed to validate booking:', error)
    return { error: 'Erreur lors de la validation' }
  }
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR')) {
    return { error: 'Non autorisé' }
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Annulée par l\'administration'
      },
    })

    revalidatePath('/admin/bookings')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Failed to cancel booking:', error)
    return { error: 'Erreur lors de l\'annulation' }
  }
}

export async function reportBookingWithVoucher(bookingId: string, reason?: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR')) {
    return { error: 'Non autorisé' }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        trip: { select: { id: true, routeId: true, price: true } },
      },
    })

    if (!booking) return { error: 'Réservation introuvable' }
    if (booking.status === 'COMPLETED') return { error: 'Impossible de reporter un billet déjà terminé' }

    const existingVoucher = await prisma.travelVoucher.findFirst({
      where: { bookingId },
      select: { code: true },
    })
    if (existingVoucher) {
      return { error: `Un bon existe déjà pour ce billet (${existingVoucher.code})` }
    }

    const code = await generateUniqueVoucherCode()
    const amount = booking.totalPrice && booking.totalPrice > 0 ? booking.totalPrice : booking.trip.price
    const beneficiaryName =
      booking.passengerName ||
      [booking.user.firstName, booking.user.lastName].filter(Boolean).join(' ').trim() ||
      'Client'

    await prisma.$transaction(async (tx) => {
      await tx.travelVoucher.create({
        data: {
          code,
          title: `Report billet ${booking.ticketNumber}`,
          beneficiaryName,
          beneficiaryPhone: booking.passengerPhone || booking.user.phone || null,
          beneficiaryEmail: booking.passengerEmail || booking.user.email || null,
          userId: booking.userId,
          valueAmount: amount,
          passengerCount: 1,
          status: 'ISSUED',
          issuedAt: new Date(),
          routeId: booking.trip.routeId,
          tripId: booking.trip.id,
          bookingId: booking.id,
          notes: reason?.trim() || `Report administratif du billet ${booking.ticketNumber}`,
          createdById: session.user.id,
        },
      })

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason?.trim() || 'Billet reporté avec émission d’un bon de voyage',
        },
      })
    })

    revalidatePath('/admin/bookings')
    revalidatePath('/admin/travel-vouchers')
    revalidatePath('/admin')
    return { success: true, code }
  } catch (error) {
    console.error('Failed to report booking with voucher:', error)
    return { error: 'Erreur lors du report du billet' }
  }
}
