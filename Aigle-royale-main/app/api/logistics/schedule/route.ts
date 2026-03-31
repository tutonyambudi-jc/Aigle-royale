import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLogisticsSession } from '../_utils'

function parseDate(input: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return Number.isFinite(d.getTime()) ? d : null
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart
}

export async function GET(request: Request) {
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const driverId = (searchParams.get('driverId') || '').trim()
    const start = parseDate(searchParams.get('start'))
    const end = parseDate(searchParams.get('end'))

    if (!start || !end) return NextResponse.json({ error: 'Période invalide' }, { status: 400 })
    if (end <= start) return NextResponse.json({ error: 'Période invalide' }, { status: 400 })

    const where: any = {
      startAt: { lt: end },
      endAt: { gt: start },
    }
    if (driverId) where.driverId = driverId

    const events = await prisma.driverScheduleEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Logistics schedule list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const driverId = typeof body?.driverId === 'string' ? body.driverId.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim().toUpperCase() : ''
    const startAt = parseDate(body?.startAt)
    const endAt = parseDate(body?.endAt)
    const busId = typeof body?.busId === 'string' ? body.busId.trim() : ''
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''

    if (!driverId || !startAt || !endAt) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    if (endAt <= startAt) return NextResponse.json({ error: 'Heure de fin invalide' }, { status: 400 })
    const validTypes = ['WORK', 'REST', 'SUSPENDED', 'REVOKED', 'SICK_LEAVE', 'ANNUAL_LEAVE']
    if (!validTypes.includes(type)) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    // Conflits: pas de chevauchement sur le même chauffeur
    const existing = await prisma.driverScheduleEvent.findMany({
      where: {
        driverId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true, type: true },
      take: 5,
    })
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Conflit: un événement existe déjà sur cette période' }, { status: 400 })
    }

    const created = await prisma.driverScheduleEvent.create({
      data: {
        driverId,
        type,
        startAt,
        endAt,
        busId: busId || null,
        notes: notes || null,
        createdById: auth.session.user.id,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    return NextResponse.json({ success: true, event: created }, { status: 201 })
  } catch (error) {
    console.error('Logistics schedule create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

