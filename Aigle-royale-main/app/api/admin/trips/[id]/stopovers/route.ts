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

    const stopovers = await prisma.tripStop.findMany({
      where: { tripId: p.id },
      orderBy: { order: 'asc' },
      include: { stop: { include: { city: true } } },
    })
    return NextResponse.json(stopovers)
  } catch (error) {
    console.error('Admin trip stopovers list error:', error)
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
    const dwellMinutes = body?.dwellMinutes != null ? Number(body.dwellMinutes) : null
    const arrivalTime = typeof body?.arrivalTime === 'string' ? new Date(body.arrivalTime) : null
    const departureTime = typeof body?.departureTime === 'string' ? new Date(body.departureTime) : null
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''

    if (!stopId) return NextResponse.json({ error: 'Arrêt requis' }, { status: 400 })
    if (dwellMinutes != null && (!Number.isFinite(dwellMinutes) || dwellMinutes < 0 || dwellMinutes > 600)) {
      return NextResponse.json({ error: 'Durée escale invalide' }, { status: 400 })
    }

    const max = await prisma.tripStop.aggregate({
      where: { tripId: p.id },
      _max: { order: true },
    })
    const nextOrder = (max._max.order ?? 0) + 1

    const tripStop = await prisma.tripStop.create({
      data: {
        tripId: p.id,
        stopId,
        order: nextOrder,
        arrivalTime,
        departureTime,
        dwellMinutes: dwellMinutes != null ? dwellMinutes : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, tripStopId: tripStop.id }, { status: 201 })
  } catch (error) {
    console.error('Admin trip stopover add error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

