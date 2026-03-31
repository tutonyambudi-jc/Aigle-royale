'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { baggageCarryOnShortLabelFr, baggageCheckedShortLabelFr } from '@/lib/baggage'
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Trip {
  id: string
  departureTime: Date | string
  arrivalTime: Date | string
  price: number
  availableSeats: number
  bus: {
    name: string
    capacity: number
    plateNumber: string
    seatType: string
  }
  route: {
    origin: string
    destination: string
    duration?: number | null
    stops?: Array<{
      id: string
      order: number
      role: string
      stop: {
        id: string
        name: string
        city: {
          id: string
          name: string
        }
      }
    }>
  }
  boardingMinutesBefore?: number
  bookings: Array<{ id: string }>
  promoActive?: boolean
  promoMode?: string | null
  promoPrice?: number | null
  promotionPercentage?: number
}

interface Availability {
  date: string
  count: number
}

interface TripSearchResultsProps {
  trips: Trip[]
  returnTrips?: Trip[]
  isRoundTrip?: boolean
  displayCurrency?: DisplayCurrency
  outboundAvailability?: Availability[]
  returnAvailability?: Availability[]
  passengerCounts?: {
    adults: number
    children: number
    babies: number
    seniors: number
  }
}

function AvailabilityList({ availability, title, onSelect }: { availability: Availability[], title: string, onSelect: (date: string) => void }) {
  if (!availability || availability.length === 0) return null

  return (
    <div className="mt-6 mb-8">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">{title}</h4>
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {availability.map((item) => {
          const d = new Date(item.date);
          return (
            <button
              key={item.date}
              onClick={() => onSelect(item.date)}
              className="flex-shrink-0 flex flex-col items-center min-w-[100px] p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary-500 hover:shadow-xl transition-all group"
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight group-hover:text-primary-600">
                {format(d, 'EEE', { locale: fr })}
              </span>
              <span className="text-base font-black text-gray-900 my-0.5">
                {format(d, 'dd/MM')}
              </span>
              <span className={`text-[10px] font-extrabold ${item.count > 0 ? 'text-primary-600' : 'text-gray-300'}`}>
                {item.count > 0 ? `${item.count} car(s)` : 'Aucun car'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface SelectableTripCardProps {
  trip: Trip
  displayCurrency: DisplayCurrency
  isSelected: boolean
  onSelect: () => void
  selectionMode: boolean
  passengerCounts: { adults: number; children: number; babies: number; seniors: number }
}

function SelectableTripCard({ trip, displayCurrency, isSelected, onSelect, selectionMode, passengerCounts }: SelectableTripCardProps) {
  const occupiedSeats = trip.bookings.length
  const availableSeats = trip.bus.capacity - occupiedSeats
  const isVIP = trip.bus.seatType === 'VIP'
  const isLowSeats = availableSeats <= 5

  const { data: session } = useSession()
  const role = session?.user?.role

  const now = new Date()
  const departureDate = new Date(trip.departureTime)
  const boardingMinutes = trip.boardingMinutesBefore || 30
  const boardingDate = new Date(departureDate.getTime() - boardingMinutes * 60000)

  // Restriction logic for UI
  let isTooLate = false
  let limitMessage = ''

  if (role === 'SUPER_AGENT' || role === 'ADMINISTRATOR' || role === 'SUPERVISOR') {
    const superAgentLimit = new Date(boardingDate.getTime() - 10 * 60000)
    if (now > superAgentLimit) {
      isTooLate = true
      limitMessage = 'Limite Super Agent dépassée'
    }
  } else {
    const clientLimit = new Date(departureDate.getTime() - 60 * 60000)
    if (now > clientLimit) {
      isTooLate = true
      limitMessage = 'Réservation fermée (1h avant départ)'
    }
  }

  const durationLabel = (() => {
    const mins = Math.round(
      (new Date(trip.arrivalTime).getTime() - new Date(trip.departureTime).getTime()) / (1000 * 60)
    )
    if (Number.isFinite(mins) && mins > 0) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`
    }
    const d = trip.route?.duration
    if (Number.isFinite(d as number) && (d as number) > 0) {
      const raw = Number(d)
      const hours = raw > 24 ? raw / 60 : raw
      return Math.abs(hours - Math.round(hours)) < 1e-9 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`
    }
    return '—'
  })()

  return (
    <div
      onClick={selectionMode && !isTooLate ? onSelect : undefined}
      className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${selectionMode && !isTooLate ? 'cursor-pointer hover:scale-[1.01]' : ''
        } ${isSelected
          ? 'border-primary-500 ring-2 ring-primary-500 shadow-xl shadow-primary-100'
          : isVIP
            ? 'border-amber-200 shadow-lg shadow-amber-100/50 hover:shadow-2xl'
            : 'border-gray-100 shadow-lg hover:shadow-2xl'
        } ${isTooLate ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      {/* Selection Indicator */}
      {selectionMode && !isTooLate && (
        <div className={`absolute top-4 left-4 z-20 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
          ? 'bg-primary-600 border-primary-600'
          : 'bg-white border-gray-300'
          }`}>
          {isSelected && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* VIP Ribbon */}
      {isVIP && (
        <div className="absolute top-4 -right-8 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-lg z-10">
          VIP
        </div>
      )}

      {/* Top gradient bar */}
      <div className={`h-1.5 ${isSelected ? 'bg-gradient-to-r from-primary-500 to-primary-600' : isVIP ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600' : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'}`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isVIP ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-gradient-to-br from-primary-100 to-primary-200'}`}>
              <svg className={`w-6 h-6 ${isVIP ? 'text-amber-600' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{trip.bus.name}</h3>
              <p className="text-sm text-gray-500">{trip.bus.plateNumber}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isVIP ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}>
              {isVIP ? '✨ Premium' : 'Standard'}
            </div>
            <div className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-wider">
              Embarquement: {format(boardingDate, 'HH:mm')}
            </div>
          </div>
        </div>

        {/* Route Timeline - Compact */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{format(new Date(trip.departureTime), 'HH:mm')}</div>
            <div className="text-sm font-medium text-gray-600">{trip.route.origin}</div>
          </div>
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isVIP ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                {durationLabel}
              </div>
              {(!trip.route.stops || trip.route.stops.length === 0) && (
                <div className="px-2 py-1 rounded-full text-[10px] font-black bg-green-500 text-white uppercase tracking-wider">
                  ✓ Ligne Directe
                </div>
              )}
            </div>
            <div className="w-full h-0.5 bg-gray-200 mt-2 relative">
              <div className={`absolute inset-0 ${isVIP ? 'bg-amber-400' : 'bg-primary-400'}`}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{format(new Date(trip.arrivalTime), 'HH:mm')}</div>
            <div className="text-sm font-medium text-gray-600">{trip.route.destination}</div>
          </div>
        </div>

        {/* Luggage Info */}
        <div className="flex items-center gap-4 mb-4 px-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Bagages en soute: <span className="font-black">{baggageCheckedShortLabelFr()}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Bagage cabine: <span className="font-black">{baggageCarryOnShortLabelFr()}</span></span>
          </div>
        </div>

        {/* Stopovers - Intermediate Stops */}
        {trip.route.stops && trip.route.stops.length > 0 && (
          <div className="mb-4 px-2">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-bold text-purple-900">
                  {trip.route.stops.length} escale{trip.route.stops.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trip.route.stops.map((stop, idx) => (
                  <div 
                    key={stop.id}
                    className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-semibold text-purple-700"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold">{stop.stop.name}</span>
                    </div>
                    <span className="text-purple-400">•</span>
                    <span className="text-[10px] uppercase font-black text-purple-500">
                      {stop.role === 'BOARDING' || stop.role === 'EMBARQUEMENT' ? '🔵 Embarquement' : 
                       stop.role === 'ALIGHTING' || stop.role === 'DEBARQUEMENT' ? '🔴 Débarquement' : 
                       '🟡 Arrêt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-black shadow-sm ${isLowSeats
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-green-100 text-green-700'}`}>
              {availableSeats} sièges restants
            </span>
            <span className="text-xs text-gray-500">{format(new Date(trip.departureTime), 'dd MMM', { locale: fr })}</span>
            {trip.promoActive && (
              <span className="px-2 py-1 bg-rose-600 text-white text-[10px] font-black rounded-md animate-bounce shadow-lg shadow-rose-200 uppercase tracking-tighter">
                {trip.promotionPercentage ? `-${trip.promotionPercentage}%` : 'PROMO'}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            {trip.promoActive && (
              <span className="text-xs font-bold text-gray-400 line-through">
                {formatCurrency(trip.price, displayCurrency)}
              </span>
            )}
            <div className={`text-2xl font-black ${isVIP ? 'text-amber-600' : 'text-primary-600'}`}>
              {formatCurrency(
                trip.promoActive && trip.promoPrice ? trip.promoPrice :
                  trip.promoActive && trip.promotionPercentage ? (trip.price * (1 - trip.promotionPercentage / 100)) :
                    trip.price,
                displayCurrency
              )}
            </div>
          </div>
        </div>

        {/* Book button for non-selection mode */}
        {!selectionMode && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href={isTooLate ? '#' : `/trips/${trip.id}/book?${new URLSearchParams(
                Object.entries(passengerCounts).map(([key, value]) => [key, String(value)])
              ).toString()}`}
              className={`w-full md:w-3/4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 ${isTooLate
                ? 'bg-gray-400 cursor-not-allowed'
                : isVIP
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:scale-[1.02] hover:shadow-lg'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:scale-[1.02] hover:shadow-lg'
                }`}
              onClick={(e) => isTooLate && e.preventDefault()}
            >
              {isTooLate ? 'Réservation fermée' : 'Réserver'}
              {!isTooLate && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </Link>
            {isTooLate && (
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                {limitMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TripSearchResults({
  trips,
  returnTrips,
  isRoundTrip,
  displayCurrency = 'FC',
  outboundAvailability,
  returnAvailability,
  passengerCounts = { adults: 1, children: 0, babies: 0, seniors: 0 }
}: TripSearchResultsProps) {
  const router = useRouter()
  const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null)

  const handleDateChange = (newDate: string, isReturn: boolean) => {
    const params = new URLSearchParams(window.location.search)
    params.set(isReturn ? 'returnDate' : 'date', newDate)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const totalPassengers = (passengerCounts.adults || 0) + (passengerCounts.children || 0) + (passengerCounts.seniors || 0);
  const totalPrice = ((selectedOutbound?.price || 0) + (selectedReturn?.price || 0)) * totalPassengers;
  const canProceed = isRoundTrip ? (selectedOutbound && selectedReturn) : selectedOutbound

  const handleProceedToBooking = () => {
    const passengerParams = new URLSearchParams({
      adults: passengerCounts.adults.toString(),
      children: passengerCounts.children.toString(),
      babies: passengerCounts.babies.toString(),
      seniors: passengerCounts.seniors.toString()
    })
    
    if (isRoundTrip && selectedOutbound && selectedReturn) {
      router.push(`/trips/book-round-trip?outboundId=${selectedOutbound.id}&returnId=${selectedReturn.id}&${passengerParams.toString()}`)
    } else if (selectedOutbound) {
      router.push(`/trips/${selectedOutbound.id}/book?${passengerParams.toString()}`)
    }
  }

  if (trips.length === 0 && (!returnTrips || returnTrips.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="relative bg-white rounded-3xl shadow-xl p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun trajet trouvé</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Nous n'avons pas trouvé de trajets pour cette recherche. Essayez de modifier vos critères ou de choisir une autre date.
            </p>

            {/* Availability Suggestion Leg */}
            <div className="max-w-xl mx-auto text-left">
              <AvailabilityList
                availability={outboundAvailability || []}
                title="Disponibilités sur d'autres dates :"
                onSelect={(d) => handleDateChange(d, false)}
              />
            </div>

            <Link href="/" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Nouvelle recherche
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Floating Summary Bar for Round Trip */}
      {isRoundTrip && (selectedOutbound || selectedReturn) && (
        <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Votre sélection</h3>
              <div className="flex flex-wrap gap-3">
                {selectedOutbound ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-sm font-medium text-primary-700">
                      Aller: {format(new Date(selectedOutbound.departureTime), 'HH:mm dd/MM')} — {formatCurrency(selectedOutbound.price, displayCurrency)}
                    </span>
                    <button onClick={() => setSelectedOutbound(null)} className="text-primary-400 hover:text-primary-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <span className="text-sm text-gray-500">Sélectionnez un trajet aller</span>
                  </div>
                )}
                {selectedReturn ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">
                      Retour: {format(new Date(selectedReturn.departureTime), 'HH:mm dd/MM')} — {formatCurrency(selectedReturn.price, displayCurrency)}
                    </span>
                    <button onClick={() => setSelectedReturn(null)} className="text-green-400 hover:text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <span className="text-sm text-gray-500">Sélectionnez un trajet retour</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-black text-primary-600">{formatCurrency(totalPrice, displayCurrency)}</div>
              </div>
              <button
                onClick={handleProceedToBooking}
                disabled={!canProceed}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${canProceed
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Réserver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions for Round Trip */}
      {isRoundTrip && !selectedOutbound && !selectedReturn && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-blue-800 font-medium">
            Sélectionnez un trajet aller ET un trajet retour pour continuer votre réservation aller-retour.
          </p>
        </div>
      )}

      {/* Outbound & Return Content Grid */}
      <div className={`grid ${isRoundTrip ? 'lg:grid-cols-2 lg:gap-12' : 'grid-cols-1'} gap-8`}>
        {/* Outbound Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isRoundTrip ? 'Départ' : 'Trajets disponibles'}</h2>
              <p className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">{trips.length} options pour l'aller</p>
            </div>
          </div>

          <AvailabilityList
            availability={outboundAvailability || []}
            title="Disponibilités Aller"
            onSelect={(d) => handleDateChange(d, false)}
          />

          {trips.length > 0 ? (
            <div className="grid gap-6">
              {trips.map((trip) => (
                <SelectableTripCard
                  key={trip.id}
                  trip={trip}
                  displayCurrency={displayCurrency}
                  isSelected={selectedOutbound?.id === trip.id}
                  onSelect={() => setSelectedOutbound(selectedOutbound?.id === trip.id ? null : trip)}
                  selectionMode={isRoundTrip || false}
                  passengerCounts={passengerCounts}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-gray-500 font-bold">Aucun car trouvé pour ce départ</p>
            </div>
          )}
        </div>

        {/* Return Column */}
        {isRoundTrip && (
          <div className="space-y-6 lg:border-l lg:pl-12 lg:border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Retour</h2>
                <p className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">{(returnTrips || []).length} options pour le retour</p>
              </div>
            </div>

            <AvailabilityList
              availability={returnAvailability || []}
              title="Disponibilités Retour"
              onSelect={(d) => handleDateChange(d, true)}
            />

            {(returnTrips && returnTrips.length > 0) ? (
              <div className="grid gap-6">
                {returnTrips.map((trip) => (
                  <SelectableTripCard
                    key={trip.id}
                    trip={trip}
                    displayCurrency={displayCurrency}
                    isSelected={selectedReturn?.id === trip.id}
                    onSelect={() => setSelectedReturn(selectedReturn?.id === trip.id ? null : trip)}
                    selectionMode={true}
                    passengerCounts={passengerCounts}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-gray-500 font-bold">Aucun car trouvé pour ce retour</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Availability for the next 30 days */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Disponibilités sur les 30 prochains jours</h3>
        {/* Carousel for 30-day availability */}
        <Slider {...{
          dots: true,
          infinite: false,
          speed: 500,
          slidesToShow: 5,
          slidesToScroll: 1,
        }}>
          {Array.from({ length: 30 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);

            const dailyTrips = trips.filter((trip) => {
              const tripDate = new Date(trip.departureTime);
              return (
                tripDate.getDate() === date.getDate() &&
                tripDate.getMonth() === date.getMonth() &&
                tripDate.getFullYear() === date.getFullYear()
              );
            });

            {/* Compare and apply promotional price */ }
            const applyPromotionalPrice = (t: any) => {
              if (!t.promoActive) return t.price;
              if (t.promoPrice) return t.promoPrice;
              if (t.promotionPercentage) return t.price * (1 - t.promotionPercentage / 100);
              return t.price;
            };

            const lowestPrice = dailyTrips.length > 0
              ? Math.min(...dailyTrips.map((trip: any) => applyPromotionalPrice(trip)))
              : null;

            const hasPromo = dailyTrips.some((t: any) => t.promoActive);

            return (
              <div
                key={index}
                className={`p-4 rounded-xl shadow-md border-2 transition relative ${hasPromo
                  ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                  : 'bg-white border-gray-100 hover:bg-gray-50'
                  } cursor-pointer`}
                onClick={() => handleDateChange(format(date, 'yyyy-MM-dd'), false)}
              >
                {hasPromo && (
                  <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse uppercase">
                    Promo
                  </div>
                )}
                <h4 className={`text-sm font-bold ${hasPromo ? 'text-rose-700' : 'text-gray-700'}`}>
                  {date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}
                </h4>
                {dailyTrips.length > 0 ? (
                  <>
                    <p className={`text-[10px] uppercase font-black ${hasPromo ? 'text-rose-500' : 'text-gray-400'}`}>
                      {dailyTrips.length} car(s)
                    </p>
                    <p className={`text-sm font-black mt-1 ${hasPromo ? 'text-rose-600' : 'text-primary-600'}`}>
                      Dès {lowestPrice?.toLocaleString()} FC
                    </p>
                    <ul className="mt-2 space-y-1">
                      {dailyTrips.map((trip: any) => (
                        <li key={trip.id} className="text-sm text-gray-500">
                          <span className="font-bold text-gray-700">{trip.bus?.name || 'Bus inconnu'}</span> - {trip.bus?.company?.name || 'Aigle Royale'}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucun bus disponible</p>
                )}
              </div>
            );
          })}
        </Slider>
      </div>

      {/* Display Lowest Price */}
      <div className="text-sm font-bold text-gray-600">
        Prix le plus bas : <span className="text-primary-600">{Math.min(...trips.map((trip) => trip.price))} FC</span>
      </div>
    </div>
  )
}
