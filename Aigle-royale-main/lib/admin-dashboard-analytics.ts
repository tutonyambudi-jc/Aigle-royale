import { prisma } from '@/lib/prisma'

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

export type PartnerPerformanceRow = {
  companyId: string | null
  name: string
  bookingsCount: number
  revenue: number
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
    tripsPast30,
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
    prisma.trip.findMany({
      where: {
        departureTime: { gte: d30, lte: now },
        isActive: true,
      },
      include: {
        bus: { select: { capacity: true } },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
    }),
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

  let totalCapacity = 0
  let totalOccupied = 0
  for (const t of tripsPast30) {
    totalCapacity += t.bus.capacity
    totalOccupied += t.bookings.length
  }
  const fillRatePercent =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0

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
    fillRatePercent,
    fillTripCount: tripsPast30.length,
    totalCapacitySeats: totalCapacity,
    totalOccupiedSeats: totalOccupied,
    partners,
  }
}
