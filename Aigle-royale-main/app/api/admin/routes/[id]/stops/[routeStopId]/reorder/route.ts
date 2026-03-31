import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; routeStopId: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const direction = body?.direction as 'up' | 'down'

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: 'Direction invalide' }, { status: 400 })
    }

    // Get current stop
    const currentStop = await prisma.routeStop.findUnique({
      where: { id: p.routeStopId }
    })

    if (!currentStop) {
      return NextResponse.json({ error: 'Arrêt non trouvé' }, { status: 404 })
    }

    if (currentStop.routeId !== p.id) {
      return NextResponse.json({ error: 'Cet arrêt n’appartient pas à cette route' }, { status: 400 })
    }

    // Find adjacent stop
    const adjacentStop = await prisma.routeStop.findFirst({
      where: {
        routeId: p.id,
        order: direction === 'up' ? currentStop.order - 1 : currentStop.order + 1
      }
    })

    if (!adjacentStop) {
      return NextResponse.json({ error: 'Impossible de déplacer dans cette direction' }, { status: 400 })
    }

    // Swap orders
    await prisma.$transaction([
      prisma.routeStop.update({
        where: { id: currentStop.id },
        data: { order: adjacentStop.order }
      }),
      prisma.routeStop.update({
        where: { id: adjacentStop.id },
        data: { order: currentStop.order }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin route stop reorder error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
