import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLogisticsSession } from '../../_utils'

function parseDate(input: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return Number.isFinite(d.getTime()) ? d : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

    const eventId = p.id
    const body = await request.json()

    const data: any = {}
    if (typeof body?.type === 'string') {
      const t = body.type.trim().toUpperCase()
      if (t !== 'WORK' && t !== 'REST') return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
      data.type = t
    }
    if (typeof body?.busId === 'string') data.busId = body.busId.trim() || null
    if (typeof body?.notes === 'string') data.notes = body.notes.trim() || null

    const startAt = body?.startAt ? parseDate(body.startAt) : null
    const endAt = body?.endAt ? parseDate(body.endAt) : null
    if ((body?.startAt && !startAt) || (body?.endAt && !endAt)) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
    }

    const current = await prisma.driverScheduleEvent.findUnique({
      where: { id: eventId },
      select: { id: true, driverId: true, startAt: true, endAt: true },
    })
    if (!current) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const nextStart = startAt || current.startAt
    const nextEnd = endAt || current.endAt
    if (nextEnd <= nextStart) return NextResponse.json({ error: 'Heure de fin invalide' }, { status: 400 })

    // Conflits
    const conflict = await prisma.driverScheduleEvent.findFirst({
      where: {
        driverId: current.driverId,
        id: { not: eventId },
        startAt: { lt: nextEnd },
        endAt: { gt: nextStart },
      },
      select: { id: true },
    })
    if (conflict) return NextResponse.json({ error: 'Conflit: un événement existe déjà sur cette période' }, { status: 400 })

    data.startAt = nextStart
    data.endAt = nextEnd

    const updated = await prisma.driverScheduleEvent.update({
      where: { id: eventId },
      data,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (error) {
    console.error('Logistics schedule update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

    await prisma.driverScheduleEvent.delete({ where: { id: p.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logistics schedule delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

