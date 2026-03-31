import { Suspense } from 'react'
import Link from 'next/link'

import { TripSearchResults } from '@/components/client/TripSearchResults'
import { AdvertisementBanner } from '@/components/advertisements/AdvertisementBanner'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'
import { normalizeSearchText } from '@/lib/search'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'

async function getTrips(origin: string, destination: string, date: string) {
  const searchDate = new Date(date)
  const startOfDay = new Date(searchDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(searchDate)
  endOfDay.setHours(23, 59, 59, 999)

  const trips = await prisma.trip.findMany({
    where: {
      isActive: true,
      departureTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      route: {
        isActive: true,
      },
    },
    include: {
      bus: true,
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
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      },
    },
    orderBy: {
      departureTime: 'asc',
    },
  })

  const o = normalizeSearchText(origin)
  const d = normalizeSearchText(destination)
  return trips.filter((t) => {
    const ro = normalizeSearchText(t.route?.origin || '')
    const rd = normalizeSearchText(t.route?.destination || '')
    
    // Vérifier correspondance origine/destination principales
    const mainRouteMatch = ro.includes(o) && rd.includes(d)
    
    // Vérifier si origine/destination correspondent aux arrêts intermédiaires
    let stopMatch = false
    if (t.route?.stops && t.route.stops.length > 0) {
      const originStops = t.route.stops.filter(s => 
        s.role === 'BOARDING' || s.role === 'EMBARQUEMENT' || s.role === 'STOP'
      )
      const destinationStops = t.route.stops.filter(s => 
        s.role === 'ALIGHTING' || s.role === 'DEBARQUEMENT' || s.role === 'STOP'
      )
      
      const hasOriginStop = originStops.some(s => 
        normalizeSearchText(s.stop.city.name).includes(o) ||
        normalizeSearchText(s.stop.name).includes(o)
      )
      const hasDestinationStop = destinationStops.some(s => 
        normalizeSearchText(s.stop.city.name).includes(d) ||
        normalizeSearchText(s.stop.name).includes(d)
      )
      
      // Accepter si l'origine est un arrêt et la destination principale, ou vice-versa
      stopMatch = (hasOriginStop && rd.includes(d)) ||
                  (ro.includes(o) && hasDestinationStop) ||
                  (hasOriginStop && hasDestinationStop)
    }
    
    return mainRouteMatch || stopMatch
  })
}

async function getReturnTrips(origin: string, destination: string, date: string) {
  const searchDate = new Date(date)
  const startOfDay = new Date(searchDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(searchDate)
  endOfDay.setHours(23, 59, 59, 999)

  const trips = await prisma.trip.findMany({
    where: {
      isActive: true,
      departureTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      route: {
        isActive: true,
      },
    },
    include: {
      bus: true,
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
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      },
    },
    orderBy: {
      departureTime: 'asc',
    },
  })

  const o = normalizeSearchText(destination)
  const d = normalizeSearchText(origin)
  return trips.filter((t) => {
    const ro = normalizeSearchText(t.route?.origin || '')
    const rd = normalizeSearchText(t.route?.destination || '')
    
    // Vérifier correspondance origine/destination principales
    const mainRouteMatch = ro.includes(o) && rd.includes(d)
    
    // Vérifier si origine/destination correspondent aux arrêts intermédiaires
    let stopMatch = false
    if (t.route?.stops && t.route.stops.length > 0) {
      const originStops = t.route.stops.filter(s => 
        s.role === 'BOARDING' || s.role === 'EMBARQUEMENT' || s.role === 'STOP'
      )
      const destinationStops = t.route.stops.filter(s => 
        s.role === 'ALIGHTING' || s.role === 'DEBARQUEMENT' || s.role === 'STOP'
      )
      
      const hasOriginStop = originStops.some(s => 
        normalizeSearchText(s.stop.city.name).includes(o) ||
        normalizeSearchText(s.stop.name).includes(o)
      )
      const hasDestinationStop = destinationStops.some(s => 
        normalizeSearchText(s.stop.city.name).includes(d) ||
        normalizeSearchText(s.stop.name).includes(d)
      )
      
      // Accepter si l'origine est un arrêt et la destination principale, ou vice-versa
      stopMatch = (hasOriginStop && rd.includes(d)) ||
                  (ro.includes(o) && hasDestinationStop) ||
                  (hasOriginStop && hasDestinationStop)
    }
    
    return mainRouteMatch || stopMatch
  })
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    origin?: string
    destination?: string
    date?: string
    returnDate?: string
    tripType?: string
    adults?: string
    children?: string
    babies?: string
    seniors?: string
  }>
}) {
  const sp = await searchParams
  const {
    origin = '',
    destination = '',
    date = format(new Date(), 'yyyy-MM-dd'),
    returnDate,
    tripType = 'one-way',
    adults = '1',
    children = '0',
    babies = '0',
    seniors = '0'
  } = sp

  // Calculate total passengers
  const totalPassengers = parseInt(adults) + parseInt(children) + parseInt(babies) + parseInt(seniors)

  const isRoundTrip = tripType === 'round-trip'

  const outboundTrips = origin && destination ? await getTrips(origin, destination, date) : []
  const returnTrips = isRoundTrip && returnDate && origin && destination
    ? await getReturnTrips(origin, destination, returnDate)
    : []

  // Feature: 5-day availability suggestions
  let outboundAvailability: { date: string, count: number }[] = []
  if (outboundTrips.length === 0 && origin && destination) {
    const dates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(date)
      d.setDate(d.getDate() + i + 1)
      return format(d, 'yyyy-MM-dd')
    })
    outboundAvailability = await Promise.all(dates.map(async (d) => ({
      date: d,
      count: (await getTrips(origin, destination, d)).length
    })))
  }

  let returnAvailability: { date: string, count: number }[] = []
  if (isRoundTrip && returnTrips.length === 0 && origin && destination && returnDate) {
    const dates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(returnDate)
      d.setDate(d.getDate() + i + 1)
      return format(d, 'yyyy-MM-dd')
    })
    returnAvailability = await Promise.all(dates.map(async (d) => ({
      date: d,
      count: (await getReturnTrips(origin, destination, d)).length
    })))
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}


      {/* Premium Hero Header */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <span className="text-gray-500">/</span>
                <span className="text-gray-300 text-sm font-medium">Résultats de recherche</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
                {origin && destination ? (
                  <>
                    {origin} <span className="text-primary-400">→</span> {destination}
                  </>
                ) : (
                  'Recherche de trajets'
                )}
              </h1>
              {origin && destination && (
                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  {isRoundTrip && returnDate && (
                    <>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Retour: {format(new Date(returnDate), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    </>
                  )}
                  <span className="text-gray-500">•</span>
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-semibold">
                    {outboundTrips.length} trajet{outboundTrips.length > 1 ? 's' : ''} trouvé{outboundTrips.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Nouvelle recherche
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <DashboardBackButton />
        
        {/* Info banner about intermediate stops */}
        {origin && destination && (
          <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-purple-900 mb-1">Réservation depuis les arrêts intermédiaires</h4>
                <p className="text-sm text-purple-700">
                  Certains bus proposent des <strong>arrêts intermédiaires</strong> avec places disponibles. 
                  Vous pouvez monter ou descendre dans ces villes même si ce ne sont pas les terminus.
                  Les trajets concernés affichent les arrêts disponibles ci-dessous.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Quick Stats */}
        {origin && destination && outboundTrips.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Trajets disponibles</div>
              <div className="text-3xl font-black text-gray-900">{outboundTrips.length}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">À partir de</div>
              <div className="text-3xl font-black text-primary-600">
                {Math.min(...outboundTrips.map(t => {
                  if (t.promoActive) {
                    if (t.promoPrice) return t.promoPrice;
                    if (t.promotionPercentage) return t.price * (1 - t.promotionPercentage / 100);
                  }
                  return t.price;
                })).toLocaleString()} <span className="text-lg">FC</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Premier départ</div>
              <div className="text-3xl font-black text-gray-900">
                {format(new Date(outboundTrips[0].departureTime), 'HH:mm')}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Type de trajet</div>
              <div className="text-xl font-bold text-gray-900">
                {isRoundTrip ? '↔ Aller-Retour' : '→ Aller simple'}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <Suspense fallback={
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Recherche en cours...</h3>
            <p className="text-gray-600">Nous trouvons les meilleures options pour vous.</p>
          </div>
        }>
          <TripSearchResults
            trips={outboundTrips}
            returnTrips={isRoundTrip ? returnTrips : undefined}
            isRoundTrip={isRoundTrip}
            displayCurrency={currency}
            outboundAvailability={outboundAvailability}
            returnAvailability={returnAvailability}
            passengerCounts={{
              adults: parseInt(adults),
              children: parseInt(children),
              babies: parseInt(babies),
              seniors: parseInt(seniors)
            }}
          />
        </Suspense>

        {/* Advertisement Banner */}
        <div className="mt-16">
          <AdvertisementBanner type="BANNER_RESULTS" />
        </div>
      </div>
    </div>
  )
}
