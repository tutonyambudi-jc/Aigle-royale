import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLogisticsSession } from '../../_utils'

function parseDate(input: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return Number.isFinite(d.getTime()) ? d : null
}

function parseTimeHHMM(input: unknown): { h: number; m: number } | null {
  if (typeof input !== 'string') return null
  const m = input.match(/^(\d{2}):(\d{2})$/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return { h: hh, m: mm }
}

function atTime(day: Date, hh: number, mm: number): Date {
  const d = new Date(day)
  d.setHours(hh, mm, 0, 0)
  return d
}

function addDays(day: Date, days: number): Date {
  const d = new Date(day)
  d.setDate(d.getDate() + days)
  return d
}

export async function POST(request: Request) {
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const driverId = typeof body?.driverId === 'string' ? body.driverId.trim() : ''
    const start = parseDate(body?.start)
    const end = parseDate(body?.end)
    const workDays = Number(body?.workDays)
    const restDays = Number(body?.restDays)
    const workStart = parseTimeHHMM(body?.workStart || '08:00')
    const workEnd = parseTimeHHMM(body?.workEnd || '18:00')
    const busId = typeof body?.busId === 'string' ? body.busId.trim() : ''
    const replaceExisting = Boolean(body?.replaceExisting)

    if (!driverId || !start || !end) return NextResponse.json({ error: 'Période/driver invalide' }, { status: 400 })
    if (end <= start) return NextResponse.json({ error: 'Période invalide' }, { status: 400 })
    if (!Number.isFinite(workDays) || workDays < 1 || workDays > 30) return NextResponse.json({ error: 'workDays invalide' }, { status: 400 })
    if (!Number.isFinite(restDays) || restDays < 0 || restDays > 30) return NextResponse.json({ error: 'restDays invalide' }, { status: 400 })
    if (!workStart || !workEnd) return NextResponse.json({ error: 'Heures invalides' }, { status: 400 })

    // on normalise la période en jours
    const rangeStart = new Date(start)
    rangeStart.setHours(0, 0, 0, 0)
    const rangeEnd = new Date(end)
    rangeEnd.setHours(0, 0, 0, 0)

    if (replaceExisting) {
      await prisma.driverScheduleEvent.deleteMany({
        where: {
          driverId,
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
      })
    } else {
      // si on ne remplace pas, on refuse si chevauchement quelconque
      const conflict = await prisma.driverScheduleEvent.findFirst({
        where: {
          driverId,
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
        select: { id: true },
      })
      if (conflict) {
        return NextResponse.json({ error: 'La période contient déjà des événements. Activez "remplacer" pour régénérer.' }, { status: 400 })
      }
    }

    const events: Array<any> = []
    let cursor = new Date(rangeStart)
    let cycleIndex = 0

    while (cursor < rangeEnd) {
      const isWork = cycleIndex < workDays
      if (isWork) {
        const s = atTime(cursor, workStart.h, workStart.m)
        const e = atTime(cursor, workEnd.h, workEnd.m)
        events.push({
          driverId,
          type: 'WORK',
          startAt: s,
          endAt: e > s ? e : addDays(s, 1), // fallback si end < start
          busId: busId || null,
          notes: 'Rotation auto',
          createdById: auth.session.user.id,
        })
      } else {
        const s = atTime(cursor, 0, 0)
        const e = addDays(s, 1)
        events.push({
          driverId,
          type: 'REST',
          startAt: s,
          endAt: e,
          busId: null,
          notes: 'Repos (rotation auto)',
          createdById: auth.session.user.id,
        })
      }

      cursor = addDays(cursor, 1)
      cycleIndex += 1
      if (cycleIndex >= workDays + restDays) cycleIndex = 0
    }

    if (events.length === 0) return NextResponse.json({ error: 'Aucun événement à créer' }, { status: 400 })

    await prisma.driverScheduleEvent.createMany({ data: events })

    return NextResponse.json({ success: true, created: events.length })
  } catch (error) {
    console.error('Logistics schedule generate error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

