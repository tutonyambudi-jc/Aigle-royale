'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { SeatMap } from './SeatMap'
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
}

export function BookingForm({ trip, availableSeats, displayCurrency = 'XOF', user }: BookingFormProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    passengerAvenue: '',
    passengerCommune: '',
    passengerCity: '',
    passengerCountry: 'CI' as CountryCode,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    if (user) {
      setFormData(prev => ({
        ...prev,
        passengerName: `${user.firstName} ${user.lastName}`,
        passengerEmail: user.email,
        passengerPhone: user.phone || prev.passengerPhone,
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedSeat) {
      setError('Veuillez sélectionner un siège')
      return
    }

    if (!formData.passengerName) {
      setError('Veuillez renseigner le nom du passager')
      return
    }

    if (!formData.passengerCity.trim()) {
      setError('Veuillez renseigner la ville du passager')
      return
    }

    if (!formData.passengerCountry) {
      setError('Veuillez sélectionner le pays')
      return
    }

    setLoading(true)

    try {
      const addressParts: string[] = []
      if (formData.passengerAvenue.trim()) addressParts.push(`Avenue: ${formData.passengerAvenue.trim()}`)
      if (formData.passengerCommune.trim()) addressParts.push(`Commune: ${formData.passengerCommune.trim()}`)
      if (formData.passengerCity.trim()) addressParts.push(`Ville: ${formData.passengerCity.trim()}`)
      if (formData.passengerCountry) addressParts.push(`Pays: ${getCountryLabel(formData.passengerCountry)}`)
      const passengerAddress = addressParts.length ? addressParts.join(', ') : ''

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          seatId: selectedSeat,
          passengerName: formData.passengerName,
          passengerPhone: formData.passengerPhone,
          passengerEmail: formData.passengerEmail,
          passengerAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Erreur réservation (Status: ${response.status})`)
        return
      }

      router.push(`/bookings/${data.bookingId}/payment`)
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
            <button
              onClick={() => router.push(`/auth/register?callbackUrl=${encodeURIComponent(window.location.href)}`)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Créer un compte
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
        {/* Seat Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionnez votre siège</h3>
          <div className="flex gap-8 items-start">
            {/* Bus on the left */}
            <div className="flex-1">
              <SeatMap
                seats={availableSeats}
                selectedSeat={selectedSeat}
                onSeatSelect={setSelectedSeat}
              />
            </div>
            
            {/* Legend on the right */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-sm sticky top-20">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Légende</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white border border-slate-200 rounded-lg shadow-sm flex-shrink-0"></div>
                    <span className="text-sm text-slate-600">Libre</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg shadow-sm flex-shrink-0"></div>
                    <span className="text-sm text-slate-600">VIP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-slate-200 rounded-lg border-transparent opacity-40 flex-shrink-0"></div>
                    <span className="text-sm text-slate-600">Occupé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-primary-600 rounded-lg shadow-lg ring-2 ring-primary-100 flex-shrink-0"></div>
                    <span className="text-sm text-slate-600">Choisi</span>
                  </div>
                </div>
                
                {/* Seats remaining info */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className={`px-4 py-3 rounded-xl text-center font-black shadow-sm ${availableSeats.length <= 5
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-primary-50 text-primary-700'}`}>
                    {availableSeats.length} sièges restants
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du passager</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="passengerName"
                value={formData.passengerName}
                onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="passengerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                id="passengerPhone"
                value={formData.passengerPhone}
                onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="passengerAvenue" className="block text-sm font-medium text-gray-700 mb-2">
                Avenue
              </label>
              <input
                type="text"
                id="passengerAvenue"
                value={formData.passengerAvenue}
                onChange={(e) => setFormData({ ...formData, passengerAvenue: e.target.value })}
                placeholder="Ex: Avenue 12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="passengerCommune" className="block text-sm font-medium text-gray-700 mb-2">
                Commune
              </label>
              <input
                type="text"
                id="passengerCommune"
                value={formData.passengerCommune}
                onChange={(e) => setFormData({ ...formData, passengerCommune: e.target.value })}
                placeholder="Ex: Cocody"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="passengerCity" className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                id="passengerCity"
                value={formData.passengerCity}
                onChange={(e) => setFormData({ ...formData, passengerCity: e.target.value })}
                placeholder="Ex: Abidjan"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="passengerCountry" className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <select
                id="passengerCountry"
                value={formData.passengerCountry}
                onChange={(e) => setFormData({ ...formData, passengerCountry: e.target.value as CountryCode })}
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

            <div className="md:col-span-2">
              <label htmlFor="passengerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="passengerEmail"
                value={formData.passengerEmail}
                onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

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
            disabled={loading || !selectedSeat}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Traitement...' : 'Continuer vers le paiement'}
          </button>
        </div>
      </form>
    </div>
  )
}
