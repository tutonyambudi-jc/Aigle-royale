import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; routeStopId: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    await prisma.routeStop.delete({
      where: { id: p.routeStopId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin route stop delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; routeStopId: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const stopId = typeof body?.stopId === 'string' ? body.stopId : ''
    const role = typeof body?.role === 'string' ? body.role.trim().toUpperCase() : 'STOP'
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''

    if (!stopId) return NextResponse.json({ error: 'Arrêt requis' }, { status: 400 })
    if (!['BOARDING', 'ALIGHTING', 'STOP', 'EMBARQUEMENT', 'DEBARQUEMENT'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const updatedStop = await prisma.routeStop.update({
      where: { id: p.routeStopId },
      data: {
        stopId,
        role,
        notes: notes || null,
      },
      include: {
        stop: {
          include: {
            city: true
          }
        }
      }
    })

    return NextResponse.json(updatedStop)
  } catch (error) {
    console.error('Admin route stop update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}
