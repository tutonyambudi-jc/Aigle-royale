'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BusRentalForm } from './BusRentalForm'

export function SearchForm() {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState<'one-way' | 'round-trip' | 'rental'>('one-way')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [returnDate, setReturnDate] = useState(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))
  const [passengerCounts, setPassengerCounts] = useState({
    adults: 1,
    children: 0,
    babies: 0,
    seniors: 0,
  })
  const [isSearching, setIsSearching] = useState(false)
  const [weeklyAvailability, setWeeklyAvailability] = useState<Array<{ date: string, count: number }>>([])
  const [weeklyReturnAvailability, setWeeklyReturnAvailability] = useState<Array<{ date: string, count: number }>>([])
  const [hasSearchedAvailability, setHasSearchedAvailability] = useState(false)
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false)
  const passengerDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerDropdownRef.current && !passengerDropdownRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.babies + passengerCounts.seniors
    console.log('SearchForm handleSubmit - passengerCounts:', passengerCounts)
    console.log('SearchForm handleSubmit - totalPassengers:', totalPassengers)
    if (totalPassengers === 0) {
      alert('Veuillez sélectionner au moins un passager')
      return
    }
    if (origin && destination && date) {
      setIsSearching(true)
      const params = new URLSearchParams({
        origin: origin,
        destination: destination,
        date: date,
        tripType: tripType as string,
        adults: passengerCounts.adults.toString(),
        children: passengerCounts.children.toString(),
        babies: passengerCounts.babies.toString(),
        seniors: passengerCounts.seniors.toString(),
      })

      if (tripType === 'round-trip' && returnDate) {
        params.append('returnDate', returnDate)
      }

      router.push(`/trips/search?${params.toString()}`)
    }
  }

  const swapCities = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const fetchAvailability = async () => {
    if (!origin || !destination) return
    try {
      const response = await fetch(
        `/api/trips/availability?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&startDate=${date}&days=7`
      )
      const data = await response.json()
      setWeeklyAvailability(data)

      if (tripType === 'round-trip' && returnDate) {
        const retResponse = await fetch(
          `/api/trips/availability?origin=${encodeURIComponent(destination)}&destination=${encodeURIComponent(origin)}&startDate=${returnDate}&days=7`
        )
        const retData = await retResponse.json()
        setWeeklyReturnAvailability(retData)
      } else {
        setWeeklyReturnAvailability([])
      }
      setHasSearchedAvailability(true)
    } catch (err) {
      console.error('Error fetching availability:', err)
    }
  }

  // Trigger availability fetch when origin/destination change or trip type changes
  useEffect(() => {
    if (tripType !== 'rental' && origin && destination && date) {
      fetchAvailability()
    }
  }, [origin, destination, date, returnDate, tripType])

  const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.babies + passengerCounts.seniors

  // Composant PassengerCounter - Design inline compact
  const PassengerCounter = ({ 
    label, 
    value, 
    onDecrement,
    onIncrement,
    color
  }: { 
    label: string
    value: number
    onDecrement: () => void
    onIncrement: () => void
    color: string
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value === 0}
          className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center transition-all ${
            value === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          −
        </button>
        <span className={`w-5 text-center font-semibold text-sm ${color}`}>{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all`}
        >
          +
        </button>
      </div>
    </div>
  )

  if (tripType === 'rental') {
    return (
      <div>
        {/* Trip Type Toggle */}
        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-full mb-6 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setTripType('one-way')}
            className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
          >
            Aller simple
          </button>
          <button
            type="button"
            onClick={() => setTripType('round-trip')}
            className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
          >
            Aller-retour
          </button>
          <button
            type="button"
            onClick={() => setTripType('rental')}
            className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all bg-primary-600 text-white shadow-lg"
          >
            Location
          </button>
        </div>
        <BusRentalForm />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Trip Type Toggle - Clean pill style */}
      <div className="flex justify-center">
        <div className="inline-flex gap-1 p-1 bg-gray-100/80 rounded-full">
          <button
            type="button"
            onClick={() => setTripType('one-way')}
            className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-200 ${
              tripType === 'one-way'
                ? 'bg-white text-primary-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aller simple
          </button>
          <button
            type="button"
            onClick={() => setTripType('round-trip')}
            className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-200 ${
              tripType === 'round-trip'
                ? 'bg-white text-primary-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aller-retour
          </button>
          <button
            type="button"
            onClick={() => setTripType('rental')}
            className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-200 ${
              tripType === 'rental'
                ? 'bg-white text-primary-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Location
          </button>
        </div>
      </div>

      {/* Main Search Fields - Horizontal Layout */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          
          {/* Origin & Destination Group */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {/* Origin */}
              <div className="group p-4 hover:bg-gray-50/50 transition-colors">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Départ
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100"></div>
                  </div>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ville de départ"
                    className="w-full pl-6 pr-3 py-2 bg-transparent border-0 focus:ring-0 text-gray-900 placeholder-gray-400 font-medium text-base"
                    required
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="group p-4 hover:bg-gray-50/50 transition-colors">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Arrivée
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></div>
                  </div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ville d'arrivée"
                    className="w-full pl-6 pr-3 py-2 bg-transparent border-0 focus:ring-0 text-gray-900 placeholder-gray-400 font-medium text-base"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Swap Button - Centered */}
            <button
              type="button"
              onClick={swapCities}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-2 border-gray-200 rounded-full shadow-md flex items-center justify-center hover:border-primary-400 hover:shadow-lg transition-all duration-200 group hidden sm:flex"
              title="Inverser les villes"
            >
              <svg className="w-5 h-5 text-gray-500 group-hover:text-primary-600 group-hover:rotate-180 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          {/* Date Fields */}
          <div className={tripType === 'round-trip' ? 'lg:col-span-4' : 'lg:col-span-4'}>
            <div className={`grid ${tripType === 'round-trip' ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-gray-100`}>
              {/* Departure Date */}
              <div className="group p-4 hover:bg-gray-50/50 transition-colors">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Date de départ
                </label>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 font-medium text-base cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Return Date */}
              {tripType === 'round-trip' && (
                <div className="group p-4 hover:bg-gray-50/50 transition-colors">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Date de retour
                  </label>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={date || format(new Date(), 'yyyy-MM-dd')}
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 font-medium text-base cursor-pointer"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Passengers Section - Inline compact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Passagers</span>
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">{totalPassengers}</span>
          </div>
          
          <div className="flex-1 grid grid-cols-4 gap-4">
            <PassengerCounter
              label="Adultes"
              value={passengerCounts.adults}
              onDecrement={() => setPassengerCounts(prev => ({ ...prev, adults: Math.max(0, prev.adults - 1) }))}
              onIncrement={() => setPassengerCounts(prev => ({ ...prev, adults: Math.min(10, prev.adults + 1) }))}
              color="text-primary-600"
            />
            <PassengerCounter
              label="Enfants"
              value={passengerCounts.children}
              onDecrement={() => setPassengerCounts(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
              onIncrement={() => setPassengerCounts(prev => ({ ...prev, children: Math.min(10, prev.children + 1) }))}
              color="text-green-600"
            />
            <PassengerCounter
              label="Bébés"
              value={passengerCounts.babies}
              onDecrement={() => setPassengerCounts(prev => ({ ...prev, babies: Math.max(0, prev.babies - 1) }))}
              onIncrement={() => setPassengerCounts(prev => ({ ...prev, babies: Math.min(10, prev.babies + 1) }))}
              color="text-pink-600"
            />
            <PassengerCounter
              label="Seniors"
              value={passengerCounts.seniors}
              onDecrement={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.max(0, prev.seniors - 1) }))}
              onIncrement={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.min(10, prev.seniors + 1) }))}
              color="text-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Weekly Availability - Compact Carousel */}
      {origin && destination && (
        <div className="space-y-4">
          {/* Outbound Carousel */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                Disponibilités Aller
              </span>
              {!hasSearchedAvailability && (
                <button
                  type="button"
                  onClick={fetchAvailability}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Actualiser
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(hasSearchedAvailability ? weeklyAvailability : Array.from({ length: 7 }, (_, i) => {
                const d = new Date(date)
                d.setDate(d.getDate() + i)
                return { date: format(d, 'yyyy-MM-dd'), count: -1 }
              })).map((item) => {
                const isSelected = item.date === date
                const d = new Date(item.date)
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => {
                      setDate(item.date)
                      if (!hasSearchedAvailability) fetchAvailability()
                    }}
                    className={`flex-shrink-0 flex flex-col items-center min-w-[70px] py-2.5 px-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/25 scale-105'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {format(d, 'EEE', { locale: fr })}
                    </span>
                    <span className="text-sm font-bold my-0.5">
                      {format(d, 'dd/MM')}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      isSelected ? 'text-white/90' : item.count > 0 ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      {item.count === -1 ? '•••' : `${item.count} bus`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Return Carousel */}
          {tripType === 'round-trip' && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Disponibilités Retour
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(hasSearchedAvailability ? weeklyReturnAvailability : Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(returnDate)
                  d.setDate(d.getDate() + i)
                  return { date: format(d, 'yyyy-MM-dd'), count: -1 }
                })).map((item) => {
                  const isSelected = item.date === returnDate
                  const d = new Date(item.date)
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => {
                        setReturnDate(item.date)
                        if (!hasSearchedAvailability) fetchAvailability()
                      }}
                      className={`flex-shrink-0 flex flex-col items-center min-w-[70px] py-2.5 px-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25 scale-105'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                        {format(d, 'EEE', { locale: fr })}
                      </span>
                      <span className="text-sm font-bold my-0.5">
                        {format(d, 'dd/MM')}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        isSelected ? 'text-white/90' : item.count > 0 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {item.count === -1 ? '•••' : `${item.count} bus`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSearching}
        className="w-full relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:shadow-primary-600/40 hover:from-primary-700 hover:to-primary-800 active:scale-[0.99] transition-all duration-200 group disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

        <span className="relative z-10 flex items-center justify-center gap-3">
          {isSearching ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Recherche en cours...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher des trajets
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-medium">Paiement sécurisé</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-medium">Confirmation instantanée</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Support 24/7</span>
        </div>
      </div>
    </form>
  )
}
