import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/layout/Navigation'
import { FreightManagement } from '@/components/freight/FreightManagement'
import { cookies } from 'next/headers'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

async function getFreightOrders(userId?: string, role?: string) {
  let where: any = {}

  if (role === 'CLIENT') {
    where.userId = userId
  } else if (role === 'AGENT' || role === 'SUPER_AGENT') {
    where.agentId = userId
  }
  // Admin et autres rôles voient tout

  return await prisma.freightOrder.findMany({
    where,
    include: {
      trip: {
        include: {
          route: true,
          bus: {
            select: {
              name: true,
              plateNumber: true,
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

async function getFreightStats(userId?: string, role?: string) {
  let where: any = {}

  if (role === 'CLIENT') {
    where.userId = userId
  } else if (role === 'AGENT' || role === 'SUPER_AGENT') {
    where.agentId = userId
  }

  const [total, received, inTransit, delivered, cancelled, totalRevenue] = await Promise.all([
    prisma.freightOrder.count({ where }),
    prisma.freightOrder.count({ where: { ...where, status: 'RECEIVED' } }),
    prisma.freightOrder.count({ where: { ...where, status: 'IN_TRANSIT' } }),
    prisma.freightOrder.count({ where: { ...where, status: 'DELIVERED' } }),
    prisma.freightOrder.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.freightOrder.aggregate({
      where: { ...where, status: { not: 'CANCELLED' } },
      _sum: { price: true },
    }),
  ])

  return {
    total,
    received,
    inTransit,
    delivered,
    cancelled,
    totalRevenue: totalRevenue._sum.price || 0,
  }
}

export default async function FreightManagePage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) {
    redirect('/auth/login')
  }

  const freightOrders = await getFreightOrders(session.user.id, session.user.role)
  const stats = await getFreightStats(session.user.id, session.user.role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Gestion de Colis</h1>
          <p className="text-gray-600 text-lg">Enregistrez, suivez et gérez tous vos colis en un seul endroit</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total colis</div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.received}</div>
            <div className="text-sm text-gray-600">Reçus</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.inTransit}</div>
            <div className="text-sm text-gray-600">En transit</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.delivered}</div>
            <div className="text-sm text-gray-600">Livrés</div>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Annulés</div>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {formatCurrency(stats.totalRevenue, currency)}
            </div>
            <div className="text-sm text-gray-600">Revenus</div>
          </div>
        </div>

        <FreightManagement initialOrders={freightOrders} userRole={session.user.role} />
      </main>
    </div>
  )
}
