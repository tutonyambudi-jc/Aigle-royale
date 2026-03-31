import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const stops = await prisma.routeStop.findMany({
      where: { routeId: p.id },
      orderBy: { order: 'asc' },
      include: { stop: { include: { city: true } } },
    })
    return NextResponse.json(stops)
  } catch (error) {
    console.error('Admin route stops list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const max = await prisma.routeStop.aggregate({
      where: { routeId: p.id },
      _max: { order: true },
    })
    const nextOrder = (max._max.order ?? 0) + 1

    const routeStop = await prisma.routeStop.create({
      data: {
        routeId: p.id,
        stopId,
        order: nextOrder,
        role,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, routeStopId: routeStop.id }, { status: 201 })
  } catch (error) {
    console.error('Admin route stop add error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

