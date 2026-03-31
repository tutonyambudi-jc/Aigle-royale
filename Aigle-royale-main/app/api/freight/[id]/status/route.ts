import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { status, notes, busId } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Statut manquant' }, { status: 400 })
    }

    const updated = await (prisma.freightOrder.update as any)({
      where: { id: p.id },
      data: {
        status,
        notes: notes || undefined,
        busId: busId || undefined,
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: true
          }
        },
        originStop: { include: { city: true } },
        destinationStop: { include: { city: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Freight status update error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}
