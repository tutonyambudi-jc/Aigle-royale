import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

async function getPartnerScope(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      partnerCompanyId: true,
      partnerCompany: { select: { id: true, name: true } },
    },
  })

  return user?.partnerCompany ?? null
}

async function getPartnerStats(companyId: string) {
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 30)

  const [fleetTotal, fleetActive, paidBookings30d, paidRevenue30d, recentTrips] = await Promise.all([
    prisma.bus.count({ where: { companyId } }),
    prisma.bus.count({ where: { companyId, isActive: true } }),
    prisma.booking.count({
      where: {
        payment: { status: 'PAID' },
        trip: {
          departureTime: { gte: periodStart },
          bus: { companyId },
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: periodStart },
        booking: {
          is: {
            trip: { bus: { companyId } },
          },
        },
      },
      _sum: { amount: true },
    }),
    prisma.trip.findMany({
      where: { bus: { companyId } },
      orderBy: { departureTime: 'desc' },
      take: 8,
      include: {
        route: { select: { origin: true, destination: true } },
        bus: { select: { plateNumber: true, name: true } },
      },
    }),
  ])

  return {
    fleetTotal,
    fleetActive,
    paidBookings30d,
    paidRevenue30d: paidRevenue30d._sum.amount ?? 0,
    recentTrips,
  }
}

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) redirect('/auth/login')
  if (
    session.user.role !== 'PARTNER_ADMIN' &&
    session.user.role !== 'ADMINISTRATOR' &&
    session.user.role !== 'SUPERVISOR'
  ) {
    redirect('/dashboard')
  }

  const partnerCompany = await getPartnerScope(session.user.id)

  if (!partnerCompany) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Module Partenaire</h1>
        <p className="text-amber-800">
          Votre compte partenaire n&apos;est pas encore rattaché à une compagnie. Contactez un administrateur.
        </p>
      </div>
    )
  }

  const stats = await getPartnerStats(partnerCompany.id)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Partenaire</h1>
        <p className="text-gray-600">
          Compagnie : <span className="font-semibold">{partnerCompany.name}</span> — consultation en lecture seule.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Flotte totale</div>
          <div className="text-3xl font-bold text-gray-900">{stats.fleetTotal}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Bus actifs</div>
          <div className="text-3xl font-bold text-emerald-700">{stats.fleetActive}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Billets payés (30 j.)</div>
          <div className="text-3xl font-bold text-gray-900">{stats.paidBookings30d}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Revenus (30 j.)</div>
          <div className="text-3xl font-bold text-primary-600">{formatCurrency(stats.paidRevenue30d, currency)}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Derniers trajets de la flotte</h2>
        {stats.recentTrips.length === 0 ? (
          <p className="text-gray-500">Aucun trajet trouvé pour cette compagnie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bus</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Immatriculation</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Itinéraire</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Départ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTrips.map((trip) => (
                  <tr key={trip.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{trip.bus.name}</td>
                    <td className="py-3 px-4 text-gray-700">{trip.bus.plateNumber}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {trip.route.origin} → {trip.route.destination}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(trip.departureTime).toLocaleString('fr-FR')}</td>
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
