import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { AgentDashboard } from '@/components/agent/AgentDashboard'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'

async function getAgentStats(userId: string) {
  const [totalSales, totalCommission, recentBookings, todayStats, monthlyStats] = await Promise.all([
    prisma.booking.count({
      where: { agentId: userId },
    }),
    prisma.commission.aggregate({
      where: { agentId: userId },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: { agentId: userId },
      include: {
        trip: {
          include: { route: true, bus: true },
        },
        payment: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.booking.aggregate({
      where: {
        agentId: userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: {
        agentId: userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
  ])

  return {
    totalSales,
    totalCommission: totalCommission._sum.amount || 0,
    recentBookings,
    todayBookings: todayStats._count,
    todayRevenue: todayStats._sum.totalPrice || 0,
    monthlyBookings: monthlyStats._count,
    monthlyRevenue: monthlyStats._sum.totalPrice || 0,
  }
}

export default async function AgentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login?role=agent')
  }

  if (session.user.role !== 'AGENT') {
    redirect('/dashboard')
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
  const stats = await getAgentStats(session.user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Tableau de bord Agent</h1>
          <p className="text-gray-600 text-lg">Bienvenue, {session.user.name}</p>
        </div>

        <AgentDashboard
          initialStats={JSON.parse(JSON.stringify(stats))}
          agentId={session.user.id}
          agentName={session.user.name || ''}
          displayCurrency={currency}
        />
      </main>
    </div>
  )
}
