import { prisma } from '@/lib/prisma'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining, isPaymentUrgent } from '@/lib/booking-utils'
import { getAdminDashboardAnalytics } from '@/lib/admin-dashboard-analytics'
import { getAdminGlobalModuleOverview } from '@/lib/admin-global-overview'
import { AdminGlobalOverview } from '@/components/admin/AdminGlobalOverview'
import { AdminFillRatePanel } from '@/components/admin/AdminFillRatePanel'
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
  const [stats, analytics, globalOverview] = await Promise.all([
    getAdminStats(),
    getAdminDashboardAnalytics(),
    getAdminGlobalModuleOverview(),
  ])

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

      <AdminGlobalOverview overview={globalOverview} />

      {/* Statistiques ventes, revenus, remplissage, partenaires */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Indicateurs de performance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ventes (7 j.)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{analytics.salesLast7d}</div>
            <div className="text-xs text-gray-500 mt-1">Billets confirmés</div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ventes (30 j.)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{analytics.salesLast30d}</div>
            <div className="text-xs text-gray-500 mt-1">Billets confirmés</div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus (7 j.)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(analytics.revenueLast7d, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Paiements encaissés</div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus (30 j.)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(analytics.revenueLast30d, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Paiements encaissés</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900 mb-2">Taux de remplissage</div>
            <AdminFillRatePanel
              fillRatePercent={analytics.fillRatePercent}
              fillTripCount={analytics.fillTripCount}
              totalCapacitySeats={analytics.totalCapacitySeats}
              totalOccupiedSeats={analytics.totalOccupiedSeats}
              fillRateGlobalGrowth={analytics.fillRateGlobalGrowth}
              fillRateByCompany={analytics.fillRateByCompany}
              fillRateByRoute={analytics.fillRateByRoute}
              fillPeriod={analytics.fillPeriod}
            />
          </div>

          <div className="lg:col-span-1 bg-white rounded-xl shadow border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance partenaires (compagnies)</h3>
                <p className="text-xs text-gray-500">
                  Top compagnies sur 30 j. — CA issu des billets payés (par bus affecté).
                </p>
              </div>
              <Link
                href="/companies/ranking"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Classement public →
              </Link>
            </div>
            {analytics.partners.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Aucune donnée compagnie sur cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-2 pr-4">Compagnie</th>
                      <th className="pb-2 pr-4">Billets payés</th>
                      <th className="pb-2">Chiffre d’affaires (30 j.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.partners.map((p, i) => (
                      <tr key={p.companyId || `row-${i}`} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{p.name}</td>
                        <td className="py-2.5 pr-4 text-gray-700">{p.bookingsCount}</td>
                        <td className="py-2.5 font-semibold text-emerald-700">
                          {formatCurrency(p.revenue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
            <Link href="/admin/city-stops" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 bg-blue-50">
              <div className="font-semibold text-gray-900">📍 Arrêts de ville</div>
              <div className="text-sm text-gray-600">Gérer les gares et arrêts</div>
            </Link>
            <Link href="/admin/notifications" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Module notifications</div>
              <div className="text-sm text-gray-600">Envoyer SMS, WhatsApp, Email et in-app</div>
            </Link>
            <Link href="/admin/notifications/dashboard" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Dashboard notifications</div>
              <div className="text-sm text-gray-600">Suivi des envois et statistiques</div>
            </Link>
            <Link href="/admin/support" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Support client</div>
              <div className="text-sm text-gray-600">Plaintes, réclamations et paramètres WhatsApp</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
