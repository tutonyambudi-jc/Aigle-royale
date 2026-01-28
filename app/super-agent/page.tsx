import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SuperAgentDashboard } from '@/components/super-agent/SuperAgentDashboard'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'

async function getSuperAgentData(userId: string) {
  const startToday = new Date(new Date().setHours(0, 0, 0, 0))
  // Get start of the week (Monday) or go back 6 days to show a full week window?
  // Let's go back 6 days from today to show a rolling 7-day window including today.
  const startOfWindow = new Date(startToday)
  startOfWindow.setDate(startOfWindow.getDate() - 6)

  const [
    totalTicketSales,
    todayTicketAgg,
    totalFreightOrders,
    todayFreightAgg,
    recentBookings,
    weeklyBookings,
    weeklyFreight
  ] = await Promise.all([
    prisma.booking.count({ where: { agencyStaffId: userId } }),
    prisma.booking.aggregate({
      where: {
        agencyStaffId: userId,
        createdAt: { gte: startToday },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
    prisma.freightOrder.count({ where: { agentId: userId } }),
    prisma.freightOrder.aggregate({
      where: {
        agentId: userId,
        createdAt: { gte: startToday },
      },
      _count: true,
      _sum: { price: true },
    }),
    prisma.booking.findMany({
      where: { agencyStaffId: userId },
      include: {
        trip: { include: { route: true, bus: true } },
        payment: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Fetch bookings for the last 7 days for the chart
    prisma.booking.findMany({
      where: {
        agencyStaffId: userId,
        createdAt: { gte: startOfWindow },
      },
      select: { createdAt: true, totalPrice: true, trip: { select: { price: true } } }
    }),
    // Fetch freight orders for the last 7 days for the chart
    prisma.freightOrder.findMany({
      where: {
        agentId: userId,
        createdAt: { gte: startOfWindow },
      },
      select: { createdAt: true, price: true }
    })
  ])

  // Aggregate weekly stats by day
  const weeklyStatsMap = new Map<string, { date: Date, tickets: number, freight: number }>();

  // Initialize map with all days in window
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWindow);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    weeklyStatsMap.set(key, { date: d, tickets: 0, freight: 0 });
  }

  // Sum up bookings
  weeklyBookings.forEach(b => {
    const key = b.createdAt.toISOString().split('T')[0];
    if (weeklyStatsMap.has(key)) {
      const entry = weeklyStatsMap.get(key)!;
      entry.tickets += (b.totalPrice || b.trip.price || 0);
    }
  });

  // Sum up freight
  weeklyFreight.forEach(f => {
    const key = f.createdAt.toISOString().split('T')[0];
    if (weeklyStatsMap.has(key)) {
      const entry = weeklyStatsMap.get(key)!;
      entry.freight += (f.price || 0);
    }
  });

  const weeklyStats = Array.from(weeklyStatsMap.values()).map(item => ({
    name: item.date.toLocaleDateString('fr-FR', { weekday: 'short' }), // e.g., 'lun.', 'mar.'
    fullDate: item.date.toISOString(),
    tickets: item.tickets,
    freight: item.freight
  }));

  return {
    stats: {
      totalTicketSales,
      todayTicketSales: todayTicketAgg._count,
      todayTicketRevenue: todayTicketAgg._sum.totalPrice || 0,
      totalFreightOrders,
      todayFreightOrders: todayFreightAgg._count,
      todayFreightRevenue: todayFreightAgg._sum.price || 0,
    },
    bookings: recentBookings, // fixed typo from original return
    weeklyStats,
    user: await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, passportPhotoUrl: true }
    })
  }
}

export default async function SuperAgentPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login?role=super-agent')
  if (session.user.role !== 'SUPER_AGENT' && session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
    redirect('/dashboard')
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
  const data = await getSuperAgentData(session.user.id)

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Espace Super Agent (Agence)</h1>
          <p className="text-gray-600 text-lg">Bienvenue, {session.user.name}</p>
        </div>
      </div>

      <SuperAgentDashboard
        initialStats={data.stats}
        initialBookings={JSON.parse(JSON.stringify(data.bookings))}
        weeklyStats={data.weeklyStats}
        displayCurrency={currency}
        agentInfo={data.user as any}
      />
    </>
  )
}
