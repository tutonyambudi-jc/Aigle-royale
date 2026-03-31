'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import SeatMap from './SeatMap'
import { COUNTRY_CODES, getCountryLabel, type CountryCode } from '@/lib/countries'

interface Seat {
  id: string
  seatNumber: string
  seatType: string
  isAvailable: boolean
}

interface Trip {
  id: string
  departureTime: Date
  arrivalTime: Date
  price: number
  bus: {
    name: string
    capacity: number
  }
  route: {
    origin: string
    destination: string
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
  promoActive?: boolean
  promoPrice?: number | null
  promotionPercentage?: number
}

interface BookingFormProps {
  trip: Trip
  availableSeats: Seat[]
  displayCurrency?: DisplayCurrency
  user?: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  } | null
  passengerCounts?: {
    adults: number
    children: number
    babies: number
    seniors: number
  }
}

export function BookingForm({ trip, availableSeats, displayCurrency = 'FC', user, passengerCounts = { adults: 1, children: 0, babies: 0, seniors: 0 } }: BookingFormProps) {
  console.log('BookingForm passengerCounts:', passengerCounts)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [premiumMode, setPremiumMode] = useState(false)
  const [seatSelectionKey, setSeatSelectionKey] = useState<'id' | 'seatNumber'>('id')
  
  // Calculate total passengers and create array of passenger types
  const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.babies + passengerCounts.seniors
  
  // Initialize passenger data for each passenger
  const [passengersData, setPassengersData] = useState<Array<{
    passengerName: string
    passengerPhone: string
    passengerEmail: string
    passengerAvenue: string
    passengerCommune: string
    passengerCity: string
    passengerCountry: CountryCode
    passengerType: 'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR'
    passengerAge: string
    hasDisability: boolean
    disabilityProofUrl: string
    boardingStopId: string
    alightingStopId: string
  }>>([])

  // Update passengers data when passenger counts change
  useEffect(() => {
    const passengerTypes: Array<'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR'> = [
      ...Array(passengerCounts.adults).fill('ADULT'),
      ...Array(passengerCounts.children).fill('CHILD'),
      ...Array(passengerCounts.babies).fill('INFANT'),
      ...Array(passengerCounts.seniors).fill('SENIOR')
    ]
    
    const newPassengersData = passengerTypes.map((type, index) => ({
      passengerName: index === 0 && user ? `${user.firstName} ${user.lastName}` : '',
      passengerPhone: index === 0 && user?.phone ? user.phone : '',
      passengerEmail: index === 0 && user ? user.email : '',
      passengerAvenue: '',
      passengerCommune: '',
      passengerCity: '',
      passengerCountry: 'CI' as CountryCode,
      passengerType: type,
      passengerAge: '',
      hasDisability: false,
      disabilityProofUrl: '',
      boardingStopId: '',
      alightingStopId: '',
    }))
    
    setPassengersData(newPassengersData)
    // Réinitialiser les sièges sélectionnés quand le nombre de passagers change
    setSelectedSeats([])
  }, [passengerCounts, user])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ar_premium_mode') : null
      if (saved === '1') setPremiumMode(true)
      else if (saved === '0') setPremiumMode(false)
    } catch {
      // ignore
    }

    // Fetch seat selection setting
    fetch('/api/settings?key=seatSelectionKey')
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setSeatSelectionKey(data.value as 'id' | 'seatNumber')
        }
      })
      .catch(err => console.error('Error fetching seat selection setting:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedSeats.length !== totalPassengers) {
      setError(`Veuillez sélectionner exactement ${totalPassengers} siège(s)`)
      return
    }

    // Validate all passenger data
    for (let i = 0; i < passengersData.length; i++) {
      const passenger = passengersData[i]
      if (!passenger.passengerName.trim()) {
        setError(`Veuillez renseigner le nom du passager ${i + 1}`)
        return
      }
      if (!passenger.passengerCity.trim()) {
        setError(`Veuillez renseigner la ville du passager ${i + 1}`)
        return
      }
      if (!passenger.passengerCountry) {
        setError(`Veuillez sélectionner le pays du passager ${i + 1}`)
        return
      }
    }

    setLoading(true)

    try {
      // Create bookings for all passengers
      const passengers = passengersData.map((passenger, index) => {
        const addressParts: string[] = []
        if (passenger.passengerAvenue.trim()) addressParts.push(`Avenue: ${passenger.passengerAvenue.trim()}`)
        if (passenger.passengerCommune.trim()) addressParts.push(`Commune: ${passenger.passengerCommune.trim()}`)
        if (passenger.passengerCity.trim()) addressParts.push(`Ville: ${passenger.passengerCity.trim()}`)
        if (passenger.passengerCountry) addressParts.push(`Pays: ${getCountryLabel(passenger.passengerCountry)}`)
        
        return {
          seatId: selectedSeats[index],
          passengerName: passenger.passengerName,
          passengerPhone: passenger.passengerPhone,
          passengerEmail: passenger.passengerEmail,
          passengerAddress: addressParts.length ? addressParts.join(', ') : '',
          passengerType: passenger.passengerType,
          passengerAge: passenger.passengerAge ? parseInt(passenger.passengerAge) : null,
          hasDisability: passenger.hasDisability,
          boardingStopId: passenger.boardingStopId || null,
          alightingStopId: passenger.alightingStopId || null,
        }
      })

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          passengers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Erreur réservation (Status: ${response.status})`)
        return
      }

      // Redirect to payment page for the booking group
      if (data.bookingGroupId) {
        router.push(`/booking-groups/${data.bookingGroupId}/payment`)
      } else {
        // Fallback to old single booking payment if bookingGroupId not present
        router.push(`/bookings/${data.bookingId}/payment`)
      }
    } catch (err: any) {
      setError(`Erreur technique: ${err?.message || 'Une erreur est survenue'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {!user && mounted && (
        <div className="mb-6 bg-primary-50 border border-primary-100 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-primary-800 font-semibold">Déjà un compte ?</h3>
            <p className="text-sm text-primary-600">Connectez-vous pour gagner des points de fidélité et réserver plus vite.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`)}
              className="px-4 py-2 bg-white text-primary-600 border border-primary-200 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      )}

      {/* Trip Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {trip.route.origin} → {trip.route.destination}
            </h2>
            <p className="text-gray-600">
              {format(new Date(trip.departureTime), 'dd MMMM yyyy à HH:mm')}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            {trip.promoActive && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 line-through">
                  {formatCurrency(trip.price, displayCurrency)}
                </span>
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded uppercase">
                  {trip.promotionPercentage ? `-${trip.promotionPercentage}%` : 'PROMO'}
                </span>
              </div>
            )}
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(
                trip.promoActive && trip.promoPrice ? trip.promoPrice :
                  trip.promoActive && trip.promotionPercentage ? (trip.price * (1 - trip.promotionPercentage / 100)) :
                    trip.price,
                displayCurrency
              )}
            </div>
            <div className="text-sm text-gray-600">par personne</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Bus: {trip.bus.name}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passenger Summary */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Réservation pour {totalPassengers} passager{totalPassengers > 1 ? 's' : ''}</h3>
              <div className="flex gap-3 mt-2 flex-wrap">
                {passengerCounts.adults > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    👨‍💼 {passengerCounts.adults} Adulte{passengerCounts.adults > 1 ? 's' : ''}
                  </span>
                )}
                {passengerCounts.children > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                    👶 {passengerCounts.children} Enfant{passengerCounts.children > 1 ? 's' : ''}
                  </span>
                )}
                {passengerCounts.babies > 0 && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold">
                    🍼 {passengerCounts.babies} Bébé{passengerCounts.babies > 1 ? 's' : ''}
                  </span>
                )}
                {passengerCounts.seniors > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
                    👴 {passengerCounts.seniors} Senior{passengerCounts.seniors > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Sièges sélectionnés</div>
              <div className="text-2xl font-black text-primary-600">{selectedSeats.length}/{totalPassengers}</div>
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionnez {totalPassengers} siège{totalPassengers > 1 ? 's' : ''}</h3>
          <div className="w-full">
            <SeatMap
              seats={availableSeats}
              selectedSeatIds={selectedSeats}
              onSeatSelect={(seats) => setSelectedSeats(Array.isArray(seats) ? seats : [seats])}
              maxSelection={totalPassengers}
              selectionKey={seatSelectionKey}
            />
          </div>
        </div>

        {/* Passenger Information - Loop through all passengers */}
        <div className="border-t pt-6 space-y-6">
          {passengersData.map((passenger, index) => {
            const seatNumber = selectedSeats[index] 
              ? availableSeats.find(s => s.id === selectedSeats[index] || s.seatNumber === selectedSeats[index])?.seatNumber 
              : null
            
            const typeLabel = passenger.passengerType === 'ADULT' ? '👨‍💼 Adulte'
              : passenger.passengerType === 'CHILD' ? '👶 Enfant'
              : passenger.passengerType === 'INFANT' ? '🍼 Bébé'
              : '👴 Senior'
            
            return (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Passager {index + 1} - {typeLabel}
                  </h3>
                  {seatNumber && (
                    <span className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold">
                      Siège {seatNumber}
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={passenger.passengerName}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerName = e.target.value
                        setPassengersData(newData)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Âge *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={passenger.passengerAge}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerAge = e.target.value
                        setPassengersData(newData)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      placeholder="Ex: 25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={passenger.passengerPhone}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerPhone = e.target.value
                        setPassengersData(newData)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={passenger.passengerCity}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerCity = e.target.value
                        setPassengersData(newData)
                      }}
                      placeholder="Ex: Abidjan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays *
                    </label>
                    <select
                      value={passenger.passengerCountry}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerCountry = e.target.value as CountryCode
                        setPassengersData(newData)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {mounted ? getCountryLabel(code) : code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={passenger.passengerEmail}
                      onChange={(e) => {
                        const newData = [...passengersData]
                        newData[index].passengerEmail = e.target.value
                        setPassengersData(newData)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Boarding & Alighting Stops for this passenger */}
                  {trip.route.stops && trip.route.stops.length > 0 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Point d'embarquement
                        </label>
                        <select
                          value={passenger.boardingStopId}
                          onChange={(e) => {
                            const newData = [...passengersData]
                            newData[index].boardingStopId = e.target.value
                            setPassengersData(newData)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">🏁 Départ: {trip.route.origin}</option>
                          {trip.route.stops
                            .filter(s => s.role === 'BOARDING' || s.role === 'EMBARQUEMENT' || s.role === 'STOP')
                            .map(stop => (
                              <option key={stop.id} value={stop.stop.id}>
                                📍 {stop.stop.name} - {stop.stop.city.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Point de débarquement
                        </label>
                        <select
                          value={passenger.alightingStopId}
                          onChange={(e) => {
                            const newData = [...passengersData]
                            newData[index].alightingStopId = e.target.value
                            setPassengersData(newData)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">🏁 Arrivée: {trip.route.destination}</option>
                          {trip.route.stops
                            .filter(s => s.role === 'ALIGHTING' || s.role === 'DEBARQUEMENT' || s.role === 'STOP')
                            .map(stop => (
                              <option key={stop.id} value={stop.stop.id}>
                                📍 {stop.stop.name} - {stop.stop.city.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || selectedSeats.length !== totalPassengers}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Traitement...' : `Continuer vers le paiement (${totalPassengers} billet${totalPassengers > 1 ? 's' : ''})`}
          </button>
        </div>
      </form>
    </div>
  )
}
