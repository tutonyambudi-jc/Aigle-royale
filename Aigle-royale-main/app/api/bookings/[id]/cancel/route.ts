import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Réservations voyageurs uniquement
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: { payment: true },
    })

    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cette réservation ne peut pas être annulée' }, { status: 400 })
    }

    if (booking.payment?.status === 'PAID') {
      return NextResponse.json({ error: 'Réservation déjà payée: annulation indisponible' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      })

      if (booking.payment && booking.payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'FAILED' },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Booking cancel error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

