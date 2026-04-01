import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/layout/Navigation'
import { cookies } from 'next/headers'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function HorairesPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; from?: string }>
}) {
  const sp = await searchParams
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  const days = Math.min(30, Math.max(1, Number(sp?.days || 14)))
  const from = sp?.from ? new Date(sp.from) : new Date()
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = addDays(start, days)

  const trips = await prisma.trip.findMany({
    where: {
      isActive: true,
      departureTime: { gte: start, lt: end },
      route: { isActive: true },
    },
    include: {
      route: {
        include: {
          stops: {
            orderBy: { order: 'asc' },
            include: {
              stop: {
                include: {
                  city: true
                }
              }
            }
          }
        }
      },
      bus: true,
      bookings: {
        where: { status: { in: ['CONFIRMED', 'PENDING'] } },
        select: { id: true },
      },
    },
    orderBy: { departureTime: 'asc' },
    take: 300,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Horaire de bus</h1>
          <p className="text-gray-600">
            Horaires des trajets disponibles (prochains {days} jours) — du{' '}
            <span className="font-semibold">{format(start, 'dd MMMM yyyy', { locale: fr })}</span>.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/horaires?days=7${sp?.from ? `&from=${encodeURIComponent(sp.from)}` : ''}`}
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${days === 7 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                }`}
            >
              7 jours
            </Link>
            <Link
              href={`/horaires?days=14${sp?.from ? `&from=${encodeURIComponent(sp.from)}` : ''}`}
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${days === 14 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                }`}
            >
              14 jours
            </Link>
            <Link
              href={`/horaires?days=30${sp?.from ? `&from=${encodeURIComponent(sp.from)}` : ''}`}
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${days === 30 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                }`}
            >
              30 jours
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3">Trajet</th>
                  <th className="text-left p-3">Départ</th>
                  <th className="text-left p-3">Arrivée</th>
                  <th className="text-left p-3">Bus</th>
                  <th className="text-right p-3">Places</th>
                  <th className="text-right p-3">Prix</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => {
                  const occupied = t.bookings.length
                  const available = Math.max(0, (t.bus?.capacity || 0) - occupied)
                  return (
                    <tr key={t.id} className="border-t">
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">
                          {t.route.origin} → {t.route.destination}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">{t.bus?.seatType === 'VIP' ? 'VIP' : 'Standard'}</div>
                          {t.route.stops && t.route.stops.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {t.route.stops.length} arrêt{t.route.stops.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900">{format(new Date(t.departureTime), 'dd MMM yyyy', { locale: fr })}</div>
                        <div className="text-xs text-gray-600">{format(new Date(t.departureTime), 'HH:mm')}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900">{format(new Date(t.arrivalTime), 'dd MMM yyyy', { locale: fr })}</div>
                        <div className="text-xs text-gray-600">{format(new Date(t.arrivalTime), 'HH:mm')}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900">{t.bus?.name || 'Bus'}</div>
                        <div className="text-xs text-gray-600">{t.bus?.plateNumber || ''}</div>
                      </td>
                      <td className="p-3 text-right font-semibold">{available}</td>
                      <td className="p-3 text-right font-bold text-primary-700">{formatCurrency(t.price, currency)}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/trips/${t.id}/book`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700"
                        >
                          Réserver
                        </Link>
                      </td>
                    </tr>
                  )
                })}

                {trips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-600">
                      Aucun horaire disponible pour la période sélectionnée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

