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
    if (session.user.role !== 'SUPER_AGENT') return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

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

    const agencyStaffId = session.user.id
    const freightAgentId = session.user.id

    const [bookings, freightAgg] = await Promise.all([
      prisma.booking.findMany({
        where: {
          agencyStaffId,
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
      }),
      prisma.freightOrder.aggregate({
        where: {
          agentId: freightAgentId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        _count: true,
        _sum: { price: true },
      }),
    ])

    const ticketCount = bookings.length
    const ticketRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || b.trip.price), 0)
    const ticketPaidCount = bookings.filter((b) => b.payment?.status === 'PAID').length
    const ticketPendingCount = bookings.filter((b) => !b.payment || b.payment.status !== 'PAID').length

    const freightCount = freightAgg._count
    const freightRevenue = freightAgg._sum.price || 0

    return NextResponse.json({
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      stats: {
        count: ticketCount,
        revenue: ticketRevenue,
        paidCount: ticketPaidCount,
        pendingCount: ticketPendingCount,
      },
      freightStats: {
        count: freightCount,
        revenue: freightRevenue,
      },
      bookings,
    })
  } catch (error) {
    console.error('Super agent reports error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

