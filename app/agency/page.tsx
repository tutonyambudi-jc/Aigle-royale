import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import Link from 'next/link'
import { cookies } from 'next/headers'

async function getAgencyStats(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todaySales, todayRevenue, recentBookings] = await Promise.all([
    prisma.booking.count({
      where: {
        agencyStaffId: userId,
        createdAt: { gte: today },
      },
    }),
    prisma.booking.aggregate({
      where: {
        agencyStaffId: userId,
        createdAt: { gte: today },
        payment: {
          status: 'PAID',
        },
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.booking.findMany({
      where: { agencyStaffId: userId },
      include: {
        trip: {
          include: { route: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    todaySales,
    todayRevenue: (todayRevenue._sum.totalPrice ?? 0) as number,
    recentBookings,
  }
}

export default async function AgencyDashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'AGENCY_STAFF' && session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
    redirect('/dashboard')
  }

  const stats = await getAgencyStats(session.user.id)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord Agence</h1>
        <p className="text-gray-600">Bienvenue, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Ventes aujourd'hui</div>
          <div className="text-3xl font-bold text-gray-900">{stats.todaySales}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Chiffre d'affaires aujourd'hui</div>
          <div className="text-3xl font-bold text-primary-600">
            {formatCurrency(stats.todayRevenue, currency)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Total des ventes</div>
          <div className="text-3xl font-bold text-gray-900">{stats.recentBookings.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/agency/bookings/new" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendre un billet</h3>
              <p className="text-gray-600 text-sm">Créer une nouvelle réservation au guichet</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/agency/freight/new" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enregistrer un colis</h3>
              <p className="text-gray-600 text-sm">Créer une nouvelle commande de fret</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ventes récentes</h2>
        {stats.recentBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>Aucune vente pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trajet</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paiement</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.passengerName}</td>
                    <td className="py-3 px-4">
                      {booking.trip.route.origin} → {booking.trip.route.destination}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {formatCurrency(booking.trip.price, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${booking.payment?.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        booking.payment?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {booking.payment?.status === 'PAID' ? 'Payé' :
                          booking.payment?.status === 'PENDING' ? 'En attente' : 'Non payé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
