'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'

interface Trip {
  id: string
  departureTime: Date
  arrivalTime: Date
  price: number
  route: {
    origin: string
    destination: string
  }
  bus: {
    name: string
    capacity: number
  }
  bookings: Array<{ id: string }>
}

interface AgentSearchTripsProps {
  agentId: string
  onSelectTrip: (tripId: string) => void
}

export function AgentSearchTrips({ agentId, onSelectTrip }: AgentSearchTripsProps) {
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    tripType: 'one-way' as 'one-way' | 'round-trip',
    returnDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
  })
  const [passengerCounts, setPassengerCounts] = useState({
    adults: 1,
    children: 0,
    babies: 0,
    seniors: 0,
  })
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Charger les dernières valeurs (pratique pour l’agent)
    try {
      const raw = localStorage.getItem('agentTripSearch')
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved && typeof saved === 'object') {
          setSearchParams((prev) => ({
            origin: typeof saved.origin === 'string' ? saved.origin : prev.origin,
            destination: typeof saved.destination === 'string' ? saved.destination : prev.destination,
            date: typeof saved.date === 'string' ? saved.date : prev.date,
            tripType: saved.tripType === 'one-way' || saved.tripType === 'round-trip' ? saved.tripType : prev.tripType,
            returnDate: typeof saved.returnDate === 'string' ? saved.returnDate : prev.returnDate,
          }))
        }
      }
    } catch (error) {
      console.error('Failed to parse agentTripSearch from localStorage:', error);
    }
  }, [])

  useEffect(() => {
    // Suggestions villes
    ; (async () => {
      try {
        const res = await fetch('/api/cities')
        const data = await res.json()
        if (res.ok && Array.isArray(data)) setCities(data)
      } catch {
        // ignore (fallback: saisie libre)
      }
    })()
  }, [])

  const searchTrips = async () => {
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const response = await fetch(
        `/api/trips/search?origin=${encodeURIComponent(searchParams.origin)}&destination=${encodeURIComponent(searchParams.destination)}&date=${searchParams.date}`
      )
      const data = await response.json()
      if (!response.ok) {
        setTrips([])
        setError(data?.error || 'Une erreur est survenue')
        return
      }
      setTrips(Array.isArray(data) ? data : [])

      try {
        localStorage.setItem('agentTripSearch', JSON.stringify(searchParams))
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error searching trips:', err)
      setTrips([])
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSeats = (trip: Trip) => {
    return trip.bus.capacity - trip.bookings.length
  }

  return (
    <div className="space-y-8">
      {/* Formulaire de recherche avec effet Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl p-8">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!searchParams.origin || !searchParams.destination) {
              setError('Veuillez renseigner la ville de départ et d’arrivée')
              return
            }
            searchTrips()
          }}
          className="relative space-y-6"
        >
          <datalist id="agent-cities-list">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {/* Type de voyage */}
          <div className="flex p-1.5 bg-gray-200/50 backdrop-blur-md rounded-2xl w-fit mx-auto md:mx-0">
            <button
              type="button"
              onClick={() => setSearchParams({ ...searchParams, tripType: 'one-way' })}
              className={`py-2 px-8 rounded-xl font-bold transition-all duration-300 ${searchParams.tripType === 'one-way'
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Aller simple
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ ...searchParams, tripType: 'round-trip' })}
              className={`py-2 px-8 rounded-xl font-bold transition-all duration-300 ${searchParams.tripType === 'round-trip'
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Aller-retour
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Départ
              </label>
              <input
                type="text"
                value={searchParams.origin}
                onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                list="agent-cities-list"
                className="w-full px-5 py-3.5 bg-white/60 border-2 border-white/20 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none shadow-sm font-semibold"
                placeholder="Ville de départ"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Arrivée
              </label>
              <input
                type="text"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                list="agent-cities-list"
                className="w-full px-5 py-3.5 bg-white/60 border-2 border-white/20 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none shadow-sm font-semibold"
                placeholder="Ville d'arrivée"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                </svg>
                Date Aller
              </label>
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-5 py-3.5 bg-white/60 border-2 border-white/20 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none shadow-sm font-semibold"
              />
            </div>
            {searchParams.tripType === 'round-trip' ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                  </svg>
                  Date Retour
                </label>
                <input
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                  min={searchParams.date || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-5 py-3.5 bg-white/60 border-2 border-white/20 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none shadow-sm font-semibold"
                />
              </div>
            ) : (
              <div className="flex items-end pb-1 lg:pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setSearchParams((p) => ({ ...p, origin: p.destination, destination: p.origin }))
                  }
                  className="flex items-center gap-2 px-4 py-3 bg-white/60 hover:bg-white text-gray-700 font-bold rounded-2xl border-2 border-white/20 transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Inverser
                </button>
              </div>
            )}
          </div>

          {/* Passengers Counters */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Passagers
              <span className="ml-auto text-primary-600 font-black text-lg">
                Total: {passengerCounts.adults + passengerCounts.children + passengerCounts.babies + passengerCounts.seniors}
              </span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Adults */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Adultes
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, adults: Math.max(0, prev.adults - 1) }))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{passengerCounts.adults}</span>
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, adults: Math.min(10, prev.adults + 1) }))}
                    className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enfants
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{passengerCounts.children}</span>
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, children: Math.min(10, prev.children + 1) }))}
                    className="w-9 h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Babies */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Bébés
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, babies: Math.max(0, prev.babies - 1) }))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{passengerCounts.babies}</span>
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, babies: Math.min(10, prev.babies + 1) }))}
                    className="w-9 h-9 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Seniors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Vieux
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.max(0, prev.seniors - 1) }))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{passengerCounts.seniors}</span>
                  <button
                    type="button"
                    onClick={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.min(10, prev.seniors + 1) }))}
                    className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchParams((p) => ({ ...p, date: format(new Date(), 'yyyy-MM-dd') }))}
                className="px-5 py-2.5 bg-white/60 hover:bg-white text-gray-700 text-sm font-bold rounded-xl border-2 border-white/20 transition-all"
              >
                Aujourd’hui
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() + 1)
                  setSearchParams((p) => ({ ...p, date: format(d, 'yyyy-MM-dd') }))
                }}
                className="px-5 py-2.5 bg-white/60 hover:bg-white text-gray-700 text-sm font-bold rounded-xl border-2 border-white/20 transition-all"
              >
                Demain
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recherche...
                </>
              ) : 'Trouver des trajets'}
            </button>
          </div>
        </form>
      </div>

      {/* Résultats avec cards Premium */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-24">
            <div className="relative inline-block">
              <div className="w-20 h-20 border-4 border-primary-500/20 rounded-full animate-ping"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-8 text-xl font-bold text-gray-400">Analyse des disponibilités...</p>
          </div>
        ) : !hasSearched ? (
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Prêt à servir un client ?</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Remplissez les critères de recherche pour découvrir les meilleures options de voyage.</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-16 text-center shadow-xl border border-white">
            <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Fin de piste !</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Aucun trajet ne correspond à ces critères pour le moment. Essayez une autre date.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => {
              const seatsLeft = getAvailableSeats(trip);
              const isLow = seatsLeft < 5;

              return (
                <div key={trip.id} className="group relative bg-white rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:scale-[1.7] group-hover:rotate-6 transition-all duration-700">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                    </svg>
                  </div>

                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                      {/* Itinéraire & Horaires */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="space-y-1">
                            <div className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                              {trip.route.origin}
                            </div>
                            <div className="text-sm font-bold text-primary-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {format(new Date(trip.departureTime), 'HH:mm')}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-center gap-2">
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"></div>
                              <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                              <div className="h-0.5 flex-1 bg-gray-100 rounded-full"></div>
                            </div>
                            <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                              Direct
                            </div>
                          </div>

                          <div className="space-y-1 text-right">
                            <div className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                              {trip.route.destination}
                            </div>
                            <div className="text-sm font-bold text-indigo-600 flex items-center justify-end gap-1">
                              {format(new Date(trip.arrivalTime), 'HH:mm')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                            </svg>
                            {format(new Date(trip.departureTime), 'EEEE dd MMMM', { locale: fr })}
                          </div>
                          <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            {trip.bus.name}
                          </div>
                          <div
                            className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                              isLow
                                ? 'bg-orange-50 border-orange-100 text-orange-600 animate-pulse'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}
                          >
                            {seatsLeft} place{seatsLeft !== 1 ? 's' : ''} libre{seatsLeft !== 1 ? 's' : ''} / {trip.bus.capacity}
                          </div>
                        </div>
                      </div>

                      {/* Prix & Action */}
                      <div className="lg:w-64 flex flex-row lg:flex-col lg:items-end justify-between items-center bg-gray-50/50 lg:bg-white rounded-3xl p-6 lg:p-0 border lg:border-0 border-gray-100">
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prix TTC</div>
                          <div className="text-4xl font-black text-gray-900">{formatCurrency(trip.price)}</div>
                        </div>

                        <button
                          onClick={() => onSelectTrip(trip.id)}
                          className="mt-0 lg:mt-6 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 active:scale-95 flex items-center gap-2 group/btn"
                        >
                          Vendre
                          <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decorative element */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
