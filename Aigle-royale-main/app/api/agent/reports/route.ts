import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfWeekMonday(d: Date) {
  const x = startOfDay(d)
  const day = x.getDay() // 0=Sun
  const diff = (day + 6) % 7 // Monday=0
  x.setDate(x.getDate() - diff)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

type Period = 'day' | 'week' | 'month'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (session.user.role !== 'AGENT') return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'day') as Period
    const dateStr = searchParams.get('date') // YYYY-MM-DD (optionnel)

    const baseDate = dateStr ? new Date(dateStr) : new Date()
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
    }

    let from: Date
    let to: Date

    if (period === 'week') {
      from = startOfWeekMonday(baseDate)
      to = new Date(from)
      to.setDate(to.getDate() + 7)
      to = new Date(to.getTime() - 1)
    } else if (period === 'month') {
      from = startOfMonth(baseDate)
      to = new Date(from.getFullYear(), from.getMonth() + 1, 1, 0, 0, 0, 0)
      to = new Date(to.getTime() - 1)
    } else {
      from = startOfDay(baseDate)
      to = endOfDay(baseDate)
    }

    const agentId = session.user.id

    // Récupérer le taux de commission de l'agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { commissionRate: true },
    })
    const AGENT_COMMISSION_PERCENTAGE = agent?.commissionRate || 10

    const bookings = await prisma.booking.findMany({
      where: {
        agentId,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            _count: {
              select: {
                bookings: {
                  where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                },
              },
            },
          },
        },
        payment: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Backfill commissions (idempotent) for PAID bookings in this range
    const paidBookingIds = bookings
      .filter((b) => b.payment?.status === 'PAID')
      .map((b) => b.id)

    if (paidBookingIds.length > 0) {
      const existing = await prisma.commission.findMany({
        where: {
          agentId,
          bookingId: { in: paidBookingIds },
        },
        select: { bookingId: true },
      })
      const existingSet = new Set(existing.map((c) => c.bookingId).filter(Boolean) as string[])
      const toCreate = paidBookingIds.filter((id) => !existingSet.has(id))

      if (toCreate.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const bookingId of toCreate) {
            const b = bookings.find((x) => x.id === bookingId)
            const amount = ((b?.payment?.amount || b?.totalPrice || 0) * AGENT_COMMISSION_PERCENTAGE) / 100
            if (amount <= 0) continue
            try {
              await tx.commission.create({
                data: {
                  agentId,
                  bookingId,
                  amount,
                  percentage: AGENT_COMMISSION_PERCENTAGE,
                  status: 'PENDING',
                },
              })
            } catch {
              // ignore duplicates
            }
          }
        })
      }
    }

    const commissions = await prisma.commission.findMany({
      where: {
        agentId,
        bookingId: { in: bookings.map((b) => b.id) },
      },
      select: { bookingId: true, amount: true, percentage: true, status: true },
    })
    const commissionByBookingId = new Map<string, { amount: number; percentage: number; status: string }>()
    for (const c of commissions) {
      if (c.bookingId) commissionByBookingId.set(c.bookingId, { amount: c.amount, percentage: c.percentage, status: c.status })
    }

    const reportBookings = bookings.map((b) => ({
      ...b,
      commission: commissionByBookingId.get(b.id) || null,
    }))

    const count = reportBookings.length
    const revenue = reportBookings.reduce((sum, b) => sum + (b.totalPrice || b.trip.price), 0)
    const commissionTotal = reportBookings.reduce((sum, b) => sum + (b.commission?.amount || 0), 0)

    return NextResponse.json({
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      stats: {
        count,
        revenue,
        commissionTotal,
      },
      bookings: reportBookings,
    })
  } catch (error) {
    console.error('Agent reports error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

