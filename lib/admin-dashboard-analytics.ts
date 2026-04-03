import { prisma } from '@/lib/prisma'

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function fillRateFromTotals(capacity: number, occupied: number) {
  return capacity > 0 ? Math.round((occupied / capacity) * 1000) / 10 : 0
}

export type PartnerPerformanceRow = {
  companyId: string | null
  name: string
  bookingsCount: number
  revenue: number
}

/** Détail remplissage par compagnie ou par ligne (trajets partis sur la fenêtre). */
export type FillRateBreakdownRow = {
  id: string | null
  label: string
  tripCount: number
  totalCapacity: number
  totalOccupied: number
  fillRatePercent: number
  /** Écart en points de % vs la période précédente (même clé), ou null si pas de base. */
  growthDeltaPoints: number | null
}

/** Taux global : comparaison 30 j. vs 30 j. précédents. */
export type FillRateGlobalGrowth = {
  currentFillRate: number
  previousFillRate: number
  deltaPoints: number
  previousTripCount: number
  previousOccupied: number
  previousCapacity: number
}

/** Bornes affichées / export (ISO) pour la période analysée et la période de comparaison. */
export type FillRatePeriodMeta = {
  currentFrom: string
  currentTo: string
  previousFrom: string
  /** Dernier instant inclus pour la période précédente (avant currentFrom). */
  previousTo: string
}

export type FillRateAnalyticsResult = {
  fillRatePercent: number
  fillTripCount: number
  totalCapacitySeats: number
  totalOccupiedSeats: number
  fillRateGlobalGrowth: FillRateGlobalGrowth
  fillRateByCompany: FillRateBreakdownRow[]
  fillRateByRoute: FillRateBreakdownRow[]
  period: FillRatePeriodMeta
}

export type AdminDashboardAnalytics = {
  salesLast7d: number
  salesLast30d: number
  revenueLast7d: number
  revenueLast30d: number
  fillRatePercent: number
  fillTripCount: number
  totalCapacitySeats: number
  totalOccupiedSeats: number
  partners: PartnerPerformanceRow[]
  fillRateGlobalGrowth: FillRateGlobalGrowth
  fillRateByCompany: FillRateBreakdownRow[]
  fillRateByRoute: FillRateBreakdownRow[]
  fillPeriod: FillRatePeriodMeta
}

const tripFillInclude = {
  bus: {
    select: {
      capacity: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  },
  route: { select: { id: true, origin: true, destination: true } },
  bookings: {
    where: { status: { not: 'CANCELLED' } },
    select: { id: true },
  },
} as const

type TripForFill = {
  bus: {
    capacity: number
    companyId: string | null
    company: { id: string; name: string } | null
  }
  route: { id: string; origin: string; destination: string }
  bookings: { id: string }[]
}

const emptyFillPeriod = (): FillRatePeriodMeta => ({
  currentFrom: new Date(0).toISOString(),
  currentTo: new Date(0).toISOString(),
  previousFrom: new Date(0).toISOString(),
  previousTo: new Date(0).toISOString(),
})

function emptyFillResult(): FillRateAnalyticsResult {
  const z: FillRateGlobalGrowth = {
    currentFillRate: 0,
    previousFillRate: 0,
    deltaPoints: 0,
    previousTripCount: 0,
    previousOccupied: 0,
    previousCapacity: 0,
  }
  return {
    fillRatePercent: 0,
    fillTripCount: 0,
    totalCapacitySeats: 0,
    totalOccupiedSeats: 0,
    fillRateGlobalGrowth: z,
    fillRateByCompany: [],
    fillRateByRoute: [],
    period: emptyFillPeriod(),
  }
}

/**
 * Taux de remplissage sur une fenêtre [rangeFrom, rangeTo] (trajets déjà partis, plafonnée à maintenant).
 * Période de comparaison : même durée immédiatement avant rangeFrom.
 */
export async function getFillRateAnalyticsForRange(
  rangeFrom: Date,
  rangeTo: Date
): Promise<FillRateAnalyticsResult> {
  const now = new Date()
  const effTo = new Date(Math.min(rangeTo.getTime(), now.getTime()))
  const effFrom = rangeFrom
  if (!(effFrom < effTo)) {
    return emptyFillResult()
  }

  const span = effTo.getTime() - effFrom.getTime()
  const prevFrom = new Date(effFrom.getTime() - span)

  const [tripsCurrent, tripsPrev] = await Promise.all([
    prisma.trip.findMany({
      where: {
        departureTime: { gte: effFrom, lte: effTo },
        isActive: true,
      },
      include: tripFillInclude,
    }),
    prisma.trip.findMany({
      where: {
        departureTime: { gte: prevFrom, lt: effFrom },
        isActive: true,
      },
      include: tripFillInclude,
    }),
  ])

  let totalCapacity = 0
  let totalOccupied = 0
  for (const t of tripsCurrent) {
    totalCapacity += t.bus.capacity
    totalOccupied += t.bookings.length
  }
  const fillRatePercent = fillRateFromTotals(totalCapacity, totalOccupied)

  let prevCapacity = 0
  let prevOccupied = 0
  for (const t of tripsPrev) {
    prevCapacity += t.bus.capacity
    prevOccupied += t.bookings.length
  }
  const previousFillRate = fillRateFromTotals(prevCapacity, prevOccupied)
  const fillRateGlobalGrowth: FillRateGlobalGrowth = {
    currentFillRate: fillRatePercent,
    previousFillRate,
    deltaPoints: Math.round((fillRatePercent - previousFillRate) * 10) / 10,
    previousTripCount: tripsPrev.length,
    previousOccupied: prevOccupied,
    previousCapacity: prevCapacity,
  }

  const tripsCur = tripsCurrent as unknown as TripForFill[]
  const tripsPrevF = tripsPrev as unknown as TripForFill[]
  const fillRateByCompany = mapsToBreakdownRows(
    accumulateByKey(tripsCur, 'company'),
    accumulateByKey(tripsPrevF, 'company'),
    (k) => (k === '__none__' ? null : k)
  )
  const fillRateByRoute = mapsToBreakdownRows(
    accumulateByKey(tripsCur, 'route'),
    accumulateByKey(tripsPrevF, 'route'),
    (k) => k
  )

  const period: FillRatePeriodMeta = {
    currentFrom: effFrom.toISOString(),
    currentTo: effTo.toISOString(),
    previousFrom: prevFrom.toISOString(),
    previousTo: new Date(effFrom.getTime() - 1).toISOString(),
  }

  return {
    fillRatePercent,
    fillTripCount: tripsCurrent.length,
    totalCapacitySeats: totalCapacity,
    totalOccupiedSeats: totalOccupied,
    fillRateGlobalGrowth,
    fillRateByCompany,
    fillRateByRoute,
    period,
  }
}

/** Paramètres d’URL `from` / `to` au format `YYYY-MM-DD` (UTC). */
export function parseFillRateDateRange(
  fromStr: string | null,
  toStr: string | null
): { ok: true; from: Date; to: Date } | { ok: false; error: string } {
  if (!fromStr?.trim() || !toStr?.trim()) {
    return { ok: false, error: 'Les paramètres from et to sont requis (YYYY-MM-DD).' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromStr) || !/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
    return { ok: false, error: 'Format de date invalide (attendu : YYYY-MM-DD).' }
  }
  const from = new Date(`${fromStr}T00:00:00.000Z`)
  const to = new Date(`${toStr}T23:59:59.999Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { ok: false, error: 'Date invalide.' }
  }
  if (from > to) {
    return { ok: false, error: 'La date de début doit être antérieure ou égale à la date de fin.' }
  }
  const maxMs = 366 * 24 * 60 * 60 * 1000
  if (to.getTime() - from.getTime() > maxMs) {
    return { ok: false, error: 'La plage ne peut pas dépasser 366 jours.' }
  }
  return { ok: true, from, to }
}

function accumulateByKey(
  trips: TripForFill[],
  mode: 'company' | 'route'
): Map<string, { label: string; tripCount: number; totalCapacity: number; totalOccupied: number }> {
  const map = new Map<string, { label: string; tripCount: number; totalCapacity: number; totalOccupied: number }>()
  for (const t of trips) {
    const key =
      mode === 'company' ? t.bus.companyId ?? '__none__' : t.route.id
    const label =
      mode === 'company'
        ? t.bus.company?.name ?? 'Compagnie non assignée'
        : `${t.route.origin} → ${t.route.destination}`
    const existing = map.get(key)
    if (existing) {
      existing.tripCount += 1
      existing.totalCapacity += t.bus.capacity
      existing.totalOccupied += t.bookings.length
    } else {
      map.set(key, {
        label,
        tripCount: 1,
        totalCapacity: t.bus.capacity,
        totalOccupied: t.bookings.length,
      })
    }
  }
  return map
}

function mapsToBreakdownRows(
  current: Map<string, { label: string; tripCount: number; totalCapacity: number; totalOccupied: number }>,
  previous: Map<string, { label: string; tripCount: number; totalCapacity: number; totalOccupied: number }>,
  idForKey: (k: string) => string | null
): FillRateBreakdownRow[] {
  const rows: FillRateBreakdownRow[] = []
  for (const [key, cur] of current) {
    const fill = fillRateFromTotals(cur.totalCapacity, cur.totalOccupied)
    const prev = previous.get(key)
    const prevFill = prev ? fillRateFromTotals(prev.totalCapacity, prev.totalOccupied) : null
    rows.push({
      id: idForKey(key),
      label: cur.label,
      tripCount: cur.tripCount,
      totalCapacity: cur.totalCapacity,
      totalOccupied: cur.totalOccupied,
      fillRatePercent: fill,
      growthDeltaPoints: prevFill !== null ? Math.round((fill - prevFill) * 10) / 10 : null,
    })
  }
  rows.sort((a, b) => b.totalOccupied - a.totalOccupied)
  return rows
}

/**
 * Statistiques ventes, revenus, taux de remplissage (trajets passés 30j), performance par compagnie partenaire (30j).
 */
export async function getAdminDashboardAnalytics(): Promise<AdminDashboardAnalytics> {
  const now = new Date()
  const d7 = daysAgo(7)
  const d30 = daysAgo(30)

  const [
    salesLast7d,
    salesLast30d,
    revenue7,
    revenue30,
    fillBlock,
    paidBookingsForPartners,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: d7 },
      },
    }),
    prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: d30 },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: d7 },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: d30 },
      },
      _sum: { amount: true },
    }),
    getFillRateAnalyticsForRange(d30, now),
    prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        payment: { status: 'PAID' },
        createdAt: { gte: d30 },
      },
      select: {
        totalPrice: true,
        trip: {
          select: {
            bus: {
              select: {
                companyId: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ])

  const partnerMap = new Map<string, { name: string; revenue: number; count: number }>()
  for (const b of paidBookingsForPartners) {
    const cid = b.trip.bus.companyId
    const name = b.trip.bus.company?.name || 'Compagnie non assignée'
    const key = cid || '__none__'
    const cur = partnerMap.get(key) || { name, revenue: 0, count: 0 }
    cur.revenue += b.totalPrice
    cur.count += 1
    partnerMap.set(key, cur)
  }

  const partners: PartnerPerformanceRow[] = Array.from(partnerMap.entries())
    .map(([id, v]) => ({
      companyId: id === '__none__' ? null : id,
      name: v.name,
      bookingsCount: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  return {
    salesLast7d,
    salesLast30d,
    revenueLast7d: revenue7._sum.amount || 0,
    revenueLast30d: revenue30._sum.amount || 0,
    fillRatePercent: fillBlock.fillRatePercent,
    fillTripCount: fillBlock.fillTripCount,
    totalCapacitySeats: fillBlock.totalCapacitySeats,
    totalOccupiedSeats: fillBlock.totalOccupiedSeats,
    partners,
    fillRateGlobalGrowth: fillBlock.fillRateGlobalGrowth,
    fillRateByCompany: fillBlock.fillRateByCompany,
    fillRateByRoute: fillBlock.fillRateByRoute,
    fillPeriod: fillBlock.period,
  }
}
