import { prisma } from '@/lib/prisma'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining, isPaymentUrgent } from '@/lib/booking-utils'
import Link from 'next/link'
import { BookingActionButtons } from '@/components/admin/BookingActionButtons'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getAdminStats() {
  const [
    totalBookings,
    totalRevenue,
    totalUsers,
    totalTrips,
    todayBookings,
    todayRevenue,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.user.count(),
    prisma.trip.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    totalBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    totalUsers,
    totalTrips,
    todayBookings,
    todayRevenue: todayRevenue._sum.amount || 0,
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
  const stats = await getAdminStats()

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord Administrateur</h1>
        <p className="text-gray-600">Bienvenue, {session?.user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Réservations totales</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.todayBookings} aujourd'hui
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Chiffre d'affaires total</div>
          <div className="text-3xl font-bold text-primary-600">
            {formatCurrency(stats.totalRevenue, currency)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {formatCurrency(stats.todayRevenue, currency)} aujourd'hui
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Utilisateurs</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Trajets actifs</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalTrips}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Réservations récentes</h2>
          <div className="space-y-3">
            {await prisma.booking.findMany({
              where: {
                trip: {
                  departureTime: {
                    gte: new Date() // Only show bookings for future trips
                  }
                }
              },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                trip: {
                  include: { route: true },
                },
                user: true,
                payment: true, // Include payment info
              },
            }).then(bookings => bookings.map(booking => {
              const needsAttention = booking.payment?.status === 'PENDING' &&
                booking.payment?.method !== 'CASH';

              return (
                <div key={booking.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {booking.trip.route.origin} → {booking.trip.route.destination}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.passengerName} • {formatCurrency(booking.trip.price, currency)}
                      </div>
                      {/* Countdown for unpaid bookings */}
                      {needsAttention && booking.payment?.status === 'PENDING' && (() => {
                        const timeRemaining = getPaymentTimeRemaining({
                          id: booking.id,
                          createdAt: booking.createdAt,
                          status: booking.status,
                          trip: booking.trip,
                          payment: booking.payment
                        })
                        const isUrgent = isPaymentUrgent({
                          id: booking.id,
                          createdAt: booking.createdAt,
                          status: booking.status,
                          trip: booking.trip,
                          payment: booking.payment
                        })

                        return (
                          <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${timeRemaining.isExpired ? 'text-red-600' :
                            isUrgent ? 'text-orange-600' :
                              'text-amber-600'
                            }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeRemaining.isExpired ? 'Expiré' : timeRemaining.formatted}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {booking.status}
                      </span>
                      <BookingActionButtons bookingId={booking.id} status={booking.status} />
                    </div>
                  </div>
                </div>
              )
            }))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/admin/bookings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Voir toutes les réservations →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rapports rapides</h2>
          <div className="space-y-3">
            <Link href="/admin/bookings" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Rapport des réservations</div>
              <div className="text-sm text-gray-600">Voir toutes les réservations</div>
            </Link>
            <Link href="/admin/reports/revenue" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Rapport financier</div>
              <div className="text-sm text-gray-600">Chiffre d'affaires et paiements</div>
            </Link>
            <Link href="/admin/reports/agents" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Performance des agents</div>
              <div className="text-sm text-gray-600">Ventes et commissions</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
