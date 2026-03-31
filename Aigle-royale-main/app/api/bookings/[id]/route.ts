import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
        seat: true,
        payment: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        agent: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    // Vérifier les permissions
    if (session.user.role !== 'ADMINISTRATOR' &&
      session.user.role !== 'AGENT' &&
      session.user.role !== 'AGENCY_STAFF' &&
      session.user.role !== 'SUPER_AGENT' &&
      booking.userId !== session.user.id &&
      booking.agentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
