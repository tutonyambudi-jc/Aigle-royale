'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'

function tripAvailableSeats(trip: Trip) {
  return Math.max(0, trip.bus.capacity - trip.bookings.length)
}
import SeatMap from '../client/SeatMap'

type PassengerGender = 'HOMME' | 'FEMME' | 'ENFANT'

interface Trip {
  id: string
  departureTime: Date
  arrivalTime: Date
  price: number
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
  bus: {
    name: string
    capacity: number
    seats: Array<{
      id: string
      seatNumber: string
      isAvailable: boolean
    }>
  }
  bookings: Array<{
    seatId: string
  }>
}

interface AgentBookingFormProps {
  agentId: string
  onSuccess: (booking: any) => void
  preselectedTripId?: string
}

export function AgentBookingForm({ agentId, preselectedTripId, onSuccess }: AgentBookingFormProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMINISTRATOR'

  const [step, setStep] = useState<'trip' | 'passenger' | 'seat' | 'payment'>('trip')
  const [trips, setTrips] = useState<Trip[]>([])
  const [returnTrips, setReturnTrips] = useState<Trip[]>([])
  const [weeklyAvailability, setWeeklyAvailability] = useState<Array<{ date: string, count: number }>>([])
  const [weeklyReturnAvailability, setWeeklyReturnAvailability] = useState<Array<{ date: string, count: number }>>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedReturnTrip, setSelectedReturnTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState({
    tripId: preselectedTripId || '',
    passengerCount: 1,
    contactPhone: '',
    contactEmail: '',
    paymentMethod: 'CASH' as 'CASH',
  })
  const [passengers, setPassengers] = useState<Array<{
    passengerName: string
    passengerGender: PassengerGender
    passengerAddress: string
    extraBaggagePieces: number
    extraBaggageOverweightKg: number
    boardingStopId?: string
    alightingStopId?: string
  }>>([{ passengerName: '', passengerGender: 'HOMME', passengerAddress: '', extraBaggagePieces: 0, extraBaggageOverweightKg: 0, boardingStopId: '', alightingStopId: '' }])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
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

  useEffect(() => {
    if (preselectedTripId) {
      fetchTripDetails(preselectedTripId)
    }
  }, [preselectedTripId])

  useEffect(() => {
    if (searchParams.origin && searchParams.destination) {
      fetchTrips()
    }
  }, [searchParams])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      // Fetch Outbound
      const outboundResp = await fetch(
        `/api/trips/search?origin=${encodeURIComponent(searchParams.origin)}&destination=${encodeURIComponent(searchParams.destination)}&date=${searchParams.date}`
      )
      const outboundData = await outboundResp.json()
      setTrips(outboundData)

      // Fetch Return if requested
      if (searchParams.tripType === 'round-trip' && searchParams.origin && searchParams.destination && searchParams.returnDate) {
        const returnResp = await fetch(
          `/api/trips/search?origin=${encodeURIComponent(searchParams.destination)}&destination=${encodeURIComponent(searchParams.origin)}&date=${searchParams.returnDate}`
        )
        const returnData = await returnResp.json()
        setReturnTrips(returnData)
      } else {
        setReturnTrips([])
      }

      setHasSearched(true)
      fetchWeeklyAvailability()
    } catch (err) {
      console.error('Error fetching trips:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklyAvailability = async () => {
    if (!searchParams.origin || !searchParams.destination) return

    try {
      // Outbound availability
      const response = await fetch(
        `/api/trips/availability?origin=${encodeURIComponent(searchParams.origin)}&destination=${encodeURIComponent(searchParams.destination)}&startDate=${searchParams.date}&days=7`
      )
      const data = await response.json()
      setWeeklyAvailability(data)

      // Return availability if round-trip
      if (searchParams.tripType === 'round-trip' && searchParams.returnDate) {
        const retResponse = await fetch(
          `/api/trips/availability?origin=${encodeURIComponent(searchParams.destination)}&destination=${encodeURIComponent(searchParams.origin)}&startDate=${searchParams.returnDate}&days=7`
        )
        const retData = await retResponse.json()
        setWeeklyReturnAvailability(retData)
      } else {
        setWeeklyReturnAvailability([])
      }
    } catch (err) {
      console.error('Error fetching weekly availability:', err)
    }
  }

  const fetchTripDetails = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      const data = await response.json()
      setSelectedTrip(data)
      setFormData(prev => ({ ...prev, tripId: tripId }))
      setSelectedSeatIds([])
      setStep('passenger')
    } catch (err) {
      console.error('Error fetching trip:', err)
    }
  }

  const handleTripSelect = (trip: Trip, isReturn: boolean = false) => {
    if (isReturn) {
      setSelectedReturnTrip(trip)
    } else {
      setSelectedTrip(trip)
      setFormData(prev => ({ ...prev, tripId: trip.id }))
      if (searchParams.tripType === 'one-way') {
        fetchTripDetails(trip.id)
      }
    }
  }

  const handleContinueToPassenger = () => {
    if (selectedTrip) {
      fetchTripDetails(selectedTrip.id)
      // Note: In a real app, we might need return trip details too for seat selection 
      // but for now we focus on the main trip details fetch for the stepper flow.
    }
  }

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId)
      if (prev.length >= formData.passengerCount) return prev
      return [...prev, seatId]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.tripId) {
      setError('Veuillez sélectionner un trajet')
      setLoading(false)
      return
    }

    if (passengers.length !== formData.passengerCount) {
      setError('Nombre de passagers invalide')
      setLoading(false)
      return
    }

    if (passengers.some((p) => !p.passengerName || !p.passengerGender || !p.passengerAddress)) {
      setError('Veuillez remplir tous les champs passager obligatoires')
      setLoading(false)
      return
    }

    if (selectedSeatIds.length !== formData.passengerCount) {
      setError('Veuillez sélectionner tous les sièges')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: formData.tripId,
          agentId: agentId,
          passengers: passengers.map((p, idx) => ({
            seatId: selectedSeatIds[idx],
            passengerName: p.passengerName,
            passengerGender: p.passengerGender,
            passengerAddress: p.passengerAddress,
            passengerPhone: formData.contactPhone,
            passengerEmail: formData.contactEmail,
            extraBaggagePieces: p.extraBaggagePieces,
            extraBaggageOverweightKg: p.extraBaggageOverweightKg,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      const bookingIds: string[] = Array.isArray(data.bookingIds)
        ? data.bookingIds
        : [data.bookingId || data.id].filter(Boolean)

      if (bookingIds.length === 0) {
        throw new Error('Missing bookingId from API response')
      }

      // Créer / mettre à jour le paiement (même CASH, pour tracer le statut) pour chaque billet
      const paymentResults = await Promise.all(
        bookingIds.map(async (id) => {
          const resp = await fetch(`/api/bookings/${id}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: formData.paymentMethod }),
          })
          const json = await resp.json().catch(() => null)
          return { ok: resp.ok, error: json?.error as string | undefined }
        })
      )
      const failed = paymentResults.find((r) => !r.ok)
      if (failed) {
        setError(failed.error || 'Une erreur est survenue lors du paiement')
        setLoading(false)
        return
      }

      // Récupérer les détails complets
      const bookingDetails = await Promise.all(
        bookingIds.map(async (id) => {
          const bookingResponse = await fetch(`/api/bookings/${id}`)
          if (!bookingResponse.ok) throw new Error('Failed to fetch booking details')
          return bookingResponse.json()
        })
      )
      onSuccess(bookingDetails.length === 1 ? bookingDetails[0] : bookingDetails)

      // Reset form
      setFormData({
        tripId: '',
        passengerCount: 1,
        contactPhone: '',
        contactEmail: '',
        paymentMethod: 'CASH',
      })
      setSelectedTrip(null)
      setPassengers([{ passengerName: '', passengerGender: 'HOMME', passengerAddress: '', extraBaggagePieces: 0, extraBaggageOverweightKg: 0, boardingStopId: '', alightingStopId: '' }])
      setSelectedSeatIds([])
      setStep('trip')
      setLoading(false)
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  const occupiedSeatIds = selectedTrip?.bookings?.map(b => b.seatId) || []
  const availableSeats = selectedTrip?.bus?.seats?.filter(
    seat => !occupiedSeatIds.includes(seat.id) && seat.isAvailable
  ) || []

  if (isAdmin) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-12 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Accès Refusé</h3>
        <p className="text-gray-600 max-w-md mx-auto font-medium">
          En tant qu'administrateur, vous n'êtes pas autorisé à effectuer des ventes directes. Cette fonctionnalité est réservée aux agents et au personnel de guichet.
        </p>
      </div>
    )
  }

  const steps = [
    {
      id: 'trip', label: 'Trajet', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'passenger', label: 'Passager', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'seat', label: 'Siège', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 'payment', label: 'Paiement', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stepper Premium */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-10">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isPast = steps.findIndex(x => x.id === step) > idx;

          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center group relative cursor-default">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-primary-600 border-primary-600 shadow-md text-white scale-105' :
                  isPast ? 'bg-green-500 border-green-500 text-white' :
                    'bg-white border-gray-100 text-gray-400'
                  }`}>
                  {isPast ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.icon}
                </div>
                <span className={`absolute -bottom-5 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-primary-600' : isPast ? 'text-green-600' : 'text-gray-400'
                  }`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-3 h-0.5 rounded-full bg-gray-100 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-primary-500 transition-all duration-500 ${isPast ? 'w-full' : 'w-0'
                    }`} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Étape 1: Recherche de trajet */}
        {step === 'trip' && (
          <div className="space-y-8">
            <div className="bg-gray-50/50 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-100 shadow-inner">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                Rechercher un trajet
              </h3>

              {/* Weekly Availability Carousel (Outbound) */}
              {hasSearched && searchParams.origin && searchParams.destination && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Départ : Disponibilités</h4>
                      {trips.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold shadow-sm shadow-green-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          DISPONIBLE
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {weeklyAvailability.map((item) => {
                      const isSelected = item.date === searchParams.date;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setSearchParams({ ...searchParams, date: item.date })}
                          className={`flex-shrink-0 flex flex-col items-center min-w-[70px] p-3 rounded-xl border-2 transition-all ${isSelected
                            ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-105'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-primary-200'
                            }`}
                        >
                          <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            {format(new Date(item.date), 'EEE', { locale: fr })}
                          </span>
                          <span className="text-sm font-bold my-0.5">
                            {format(new Date(item.date), 'dd/MM')}
                          </span>
                          <span className={`text-[9px] font-bold ${isSelected ? 'text-white/90' : item.count > 0 ? 'text-primary-500' : 'text-gray-300'
                            }`}>
                            {item.count} car{item.count > 1 ? 's' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Weekly Availability Carousel (Return) */}
              {hasSearched && searchParams.tripType === 'round-trip' && searchParams.origin && searchParams.destination && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Retour : Disponibilités</h4>
                      {returnTrips.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold shadow-sm shadow-green-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          DISPONIBLE
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {weeklyReturnAvailability.map((item) => {
                      const isSelected = item.date === searchParams.returnDate;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setSearchParams({ ...searchParams, returnDate: item.date })}
                          className={`flex-shrink-0 flex flex-col items-center min-w-[70px] p-3 rounded-xl border-2 transition-all ${isSelected
                            ? 'bg-green-600 border-green-600 text-white shadow-md scale-105'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-green-200'
                            }`}
                        >
                          <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            {format(new Date(item.date), 'EEE', { locale: fr })}
                          </span>
                          <span className="text-sm font-bold my-0.5">
                            {format(new Date(item.date), 'dd/MM')}
                          </span>
                          <span className={`text-[9px] font-bold ${isSelected ? 'text-white/90' : item.count > 0 ? 'text-green-500' : 'text-gray-300'
                            }`}>
                            {item.count} car{item.count > 1 ? 's' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Type de voyage */}
              <div className="flex p-1 bg-white rounded-xl w-fit mb-6 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setSearchParams({ ...searchParams, tripType: 'one-way' })}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${searchParams.tripType === 'one-way' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Aller simple
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ ...searchParams, tripType: 'round-trip' })}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${searchParams.tripType === 'round-trip' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Aller-retour
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Départ</label>
                  <input
                    type="text"
                    value={searchParams.origin}
                    onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 transition-all outline-none font-semibold text-gray-700 text-sm"
                    placeholder="Ville de départ"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Arrivée</label>
                  <input
                    type="text"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 transition-all outline-none font-semibold text-gray-700 text-sm"
                    placeholder="Ville d'arrivée"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date d'aller</label>
                  <input
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 transition-all outline-none font-semibold text-gray-700 text-sm"
                  />
                </div>
                {searchParams.tripType === 'round-trip' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date de retour</label>
                    <input
                      type="date"
                      value={searchParams.returnDate}
                      onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                      min={searchParams.date}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 transition-all outline-none font-semibold text-gray-700 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Passengers Counters */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 mt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-4">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Passagers
                  <span className="ml-auto text-primary-600 font-black">
                    Total: {passengerCounts.adults + passengerCounts.children + passengerCounts.babies + passengerCounts.seniors}
                  </span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Adults */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Adultes
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, adults: Math.max(0, prev.adults - 1) }))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm transition-all active:scale-95"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold">{passengerCounts.adults}</span>
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, adults: Math.min(10, prev.adults + 1) }))}
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center font-bold text-sm transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Enfants
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm transition-all active:scale-95"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold">{passengerCounts.children}</span>
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, children: Math.min(10, prev.children + 1) }))}
                        className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center font-bold text-sm transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Babies */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Bébés
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, babies: Math.max(0, prev.babies - 1) }))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm transition-all active:scale-95"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold">{passengerCounts.babies}</span>
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, babies: Math.min(10, prev.babies + 1) }))}
                        className="w-8 h-8 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-sm transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Seniors */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Vieux
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.max(0, prev.seniors - 1) }))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm transition-all active:scale-95"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold">{passengerCounts.seniors}</span>
                      <button
                        type="button"
                        onClick={() => setPassengerCounts(prev => ({ ...prev, seniors: Math.min(10, prev.seniors + 1) }))}
                        className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold text-sm transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 ml-1">
                  {searchParams.tripType === 'round-trip' ? 'Trajets aller' : 'Trajets disponibles'}
                </h3>
                <div className="grid gap-4">
                  {trips.map((trip) => {
                    const seatsLeft = tripAvailableSeats(trip)
                    return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => handleTripSelect(trip)}
                      className={`group relative w-full text-left p-6 bg-white border-2 rounded-[1.5rem] transition-all duration-300 ${selectedTrip?.id === trip.id ? 'border-primary-600 ring-2 ring-primary-100 shadow-xl' : 'border-gray-100 hover:border-primary-500 hover:shadow-xl'}`}
                    >
                      {selectedTrip?.id === trip.id && (
                        <div className="absolute top-4 right-4 bg-primary-600 text-white p-1 rounded-full shadow-md">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-bold text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">
                          {trip.route.origin} → {trip.route.destination}
                        </div>
                        <div className="text-xl font-bold text-primary-600">
                          {formatCurrency(trip.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {format(new Date(trip.departureTime), 'dd MMM, HH:mm')}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          {trip.bus.name}
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        {seatsLeft} place{seatsLeft !== 1 ? 's' : ''} libre{seatsLeft !== 1 ? 's' : ''} / {trip.bus.capacity}
                      </div>
                    </button>
                    )
                  })}
                </div>
              </div>

              {searchParams.tripType === 'round-trip' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 ml-1">Trajets retour</h3>
                  <div className="grid gap-4">
                    {returnTrips.map((trip) => {
                      const seatsLeft = tripAvailableSeats(trip)
                      return (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => handleTripSelect(trip, true)}
                        className={`group relative w-full text-left p-6 bg-white border-2 rounded-[1.5rem] transition-all duration-300 ${selectedReturnTrip?.id === trip.id ? 'border-green-600 ring-2 ring-green-100 shadow-xl' : 'border-gray-100 hover:border-green-500 hover:shadow-xl'}`}
                      >
                        {selectedReturnTrip?.id === trip.id && (
                          <div className="absolute top-4 right-4 bg-green-600 text-white p-1 rounded-full shadow-md">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-base font-bold text-gray-900 tracking-tight group-hover:text-green-600 transition-colors">
                            {trip.route.origin} → {trip.route.destination}
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(trip.price)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(trip.departureTime), 'dd MMM, HH:mm')}
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            {trip.bus.name}
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-semibold text-emerald-700">
                          {seatsLeft} place{seatsLeft !== 1 ? 's' : ''} libre{seatsLeft !== 1 ? 's' : ''} / {trip.bus.capacity}
                        </div>
                      </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Validation Button for Step 1 */}
            <div className="flex justify-end pt-6">
              <button
                type="button"
                disabled={!selectedTrip || (searchParams.tripType === 'round-trip' && !selectedReturnTrip)}
                onClick={handleContinueToPassenger}
                className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                Continuer
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>

            {hasSearched && trips.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2rem] text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-amber-900 mb-2">
                  {searchParams.tripType === 'round-trip' ? "Pas de bus pour l'aller" : 'Aucun bus disponible'}
                </h4>
                <p className="text-amber-700 text-sm max-w-md mx-auto">
                  Nous n'avons trouvé aucun trajet aller correspondant à vos critères.
                </p>
              </div>
            )}

            {hasSearched && searchParams.tripType === 'round-trip' && returnTrips.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 p-8 rounded-[2rem] text-center animate-in fade-in zoom-in duration-500 mt-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-orange-900 mb-2">Pas de bus pour le retour</h4>
                <p className="text-orange-700 text-sm max-w-md mx-auto">
                  Aucun trajet retour disponible pour la date du {format(new Date(searchParams.returnDate), 'dd/MM/yyyy')}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Informations passager */}
        {step === 'passenger' && selectedTrip && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`grid ${selectedReturnTrip ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {/* Aller */}
              <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-[1.5rem] p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">ALLER : Trajet Sélectionné</div>
                  <div className="text-xl font-bold italic tracking-tighter">
                    {selectedTrip.route.origin} <span className="mx-2 opacity-50 not-italic tracking-normal">→</span> {selectedTrip.route.destination}
                  </div>
                  <div className="flex items-center gap-3 mt-4 text-sm font-bold opacity-90">
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {format(new Date(selectedTrip.departureTime), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retour (Optionnel) */}
              {selectedReturnTrip && (
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-[1.5rem] p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">RETOUR : Trajet Sélectionné</div>
                    <div className="text-xl font-bold italic tracking-tighter">
                      {selectedReturnTrip.route.origin} <span className="mx-2 opacity-50 not-italic tracking-normal">→</span> {selectedReturnTrip.route.destination}
                    </div>
                    <div className="flex items-center gap-3 mt-4 text-sm font-bold opacity-90">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {format(new Date(selectedReturnTrip.departureTime), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setStep('trip')
                  setSelectedTrip(null)
                  setSelectedReturnTrip(null)
                }}
                className="px-6 py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-[1.2rem] font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-lg text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Changer de trajet
              </button>
            </div>

            <div className="space-y-8 bg-gray-50/50 rounded-[1.5rem] p-6 border border-gray-100">
              <div className="flex items-center justify-between border-l-4 border-primary-600 pl-4">
                <h3 className="text-lg font-bold text-gray-900">Détails de la réservation</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Bus Disponible
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre de billets *</label>
                  <select
                    value={formData.passengerCount}
                    onChange={(e) => {
                      const count = Math.max(1, Math.min(10, Number(e.target.value) || 1))
                      setFormData((p) => ({ ...p, passengerCount: count }))
                      setPassengers((prev) => {
                        const next = [...prev]
                        while (next.length < count) next.push({ passengerName: '', passengerGender: 'HOMME', passengerAddress: '', extraBaggagePieces: 0, extraBaggageOverweightKg: 0, boardingStopId: '', alightingStopId: '' })
                        return next.slice(0, count)
                      })
                      setSelectedSeatIds([])
                    }}
                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-500 transition-all font-bold text-gray-700 appearance-none"
                  >
                    {Array.from({ length: Math.min(10, Math.max(1, availableSeats.length)) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} Billets</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Téléphone de contact</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-500 transition-all font-bold text-gray-700"
                    placeholder="+225 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email (facultatif)</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-500 transition-all font-bold text-gray-700"
                    placeholder="client@email.com"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {passengers.map((p, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-100 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-primary-50 transition-colors"></div>
                    <div className="relative flex items-center gap-4 mb-6">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-sm">
                        {idx + 1}
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Information Passager</h4>
                    </div>

                    <div className="relative grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom complet *</label>
                        <input
                          type="text"
                          value={p.passengerName}
                          onChange={(e) =>
                            setPassengers((prev) => prev.map((x, i) => (i === idx ? { ...x, passengerName: e.target.value } : x)))
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                          placeholder="Ex: Kouassi Konan"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Genre *</label>
                        <select
                          value={p.passengerGender}
                          onChange={(e) =>
                            setPassengers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, passengerGender: e.target.value as PassengerGender } : x
                              )
                            )
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                        >
                          <option value="HOMME">Homme</option>
                          <option value="FEMME">Femme</option>
                          <option value="ENFANT">Enfant / Junior</option>
                        </select>
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Adresse de destination / Domicile *</label>
                        <input
                          type="text"
                          value={p.passengerAddress}
                          onChange={(e) =>
                            setPassengers((prev) => prev.map((x, i) => (i === idx ? { ...x, passengerAddress: e.target.value } : x)))
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                          placeholder="Quartier, Repère précis..."
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bagages soute (Nb)</label>
                        <input
                          type="number"
                          min={0}
                          value={p.extraBaggagePieces}
                          onChange={(e) =>
                            setPassengers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, extraBaggagePieces: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : x
                              )
                            )
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Poids excédentaire (kg)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          value={p.extraBaggageOverweightKg}
                          onChange={(e) =>
                            setPassengers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, extraBaggageOverweightKg: Math.max(0, Number(e.target.value) || 0) } : x
                              )
                            )
                          }
                          className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-700"
                        />
                      </div>

                      {/* Boarding & Alighting Stops */}
                      {selectedTrip?.route?.stops && selectedTrip.route.stops.length > 0 && (
                        <>
                          <div className="md:col-span-3">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                              <p className="text-xs text-purple-900 font-semibold">
                                💡 Ce trajet propose des arrêts intermédiaires. Vous pouvez choisir des points d'embarquement/débarquement différents.
                              </p>
                            </div>
                          </div>
                          <div className="md:col-span-1.5 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Point d'embarquement</label>
                            <select
                              value={p.boardingStopId || ''}
                              onChange={(e) =>
                                setPassengers((prev) => prev.map((x, i) => (i === idx ? { ...x, boardingStopId: e.target.value } : x)))
                              }
                              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                            >
                              <option value="">🏁 Départ: {selectedTrip.route.origin}</option>
                              {selectedTrip.route.stops
                                .filter(s => s.role === 'BOARDING' || s.role === 'EMBARQUEMENT' || s.role === 'STOP')
                                .map(stop => (
                                  <option key={stop.id} value={stop.stop.id}>
                                    📍 {stop.stop.name} - {stop.stop.city.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="md:col-span-1.5 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Point de débarquement</label>
                            <select
                              value={p.alightingStopId || ''}
                              onChange={(e) =>
                                setPassengers((prev) => prev.map((x, i) => (i === idx ? { ...x, alightingStopId: e.target.value } : x)))
                              }
                              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl transition-all font-semibold text-gray-700 text-sm"
                            >
                              <option value="">🏁 Arrivée: {selectedTrip.route.destination}</option>
                              {selectedTrip.route.stops
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
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep('trip')}
                className="px-8 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95 text-sm"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep('seat')}
                className="px-8 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                Choisir les sièges
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Sélection de siège */}
        {step === 'seat' && selectedTrip && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white shadow-xl flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-black tracking-tight">Configuration du Bus</h3>
                <p className="text-sm font-semibold text-gray-500">Choisissez {formData.passengerCount} siège{formData.passengerCount > 1 ? 's' : ''} parmi les places disponibles.</p>
              </div>
            </div>

            <div className="w-full">
              <SeatMap
                seats={selectedTrip.bus.seats.map(s => ({
                  ...s,
                  isAvailable: s.isAvailable && !occupiedSeatIds.includes(s.id),
                  seatType: (s as any).seatType || 'STANDARD'
                }))}
                selectedSeatIds={selectedSeatIds}
                onSeatSelect={(seatId: string | string[]) => {
                  const ids = Array.isArray(seatId) ? seatId : [seatId];
                  setSelectedSeatIds(ids.filter(Boolean));
                }}
                maxSelection={formData.passengerCount}
                selectionKey="id" // Or "seatNumber" based on admin config
              />
            </div>


            <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep('passenger')}
                className="px-8 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95 text-sm"
              >
                Retour
              </button>
              {selectedSeatIds.length === formData.passengerCount ? (
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="px-8 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
                >
                  Continuer vers le paiement
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ) : (
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 italic transition-all animate-pulse">
                  Sélectionnez {formData.passengerCount - selectedSeatIds.length} place(s) de plus
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 4: Paiement */}
        {step === 'payment' && selectedTrip && selectedSeatIds.length === formData.passengerCount && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full translate-x-32 -translate-y-32"></div>

              <h3 className="relative text-xl font-bold text-gray-900 mb-8 border-l-4 border-indigo-600 pl-4 tracking-tight">Récapitulatif de la vente</h3>

              <div className="relative space-y-6">
                <div className="pb-6 border-b border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trajet Aller</div>
                    <div className="text-base font-bold text-gray-900 italic">{selectedTrip.route.origin} → {selectedTrip.route.destination}</div>
                  </div>
                  {selectedReturnTrip && (
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trajet Retour</div>
                      <div className="text-base font-bold text-gray-900 italic">{selectedReturnTrip.route.origin} → {selectedReturnTrip.route.destination}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Billetterie</div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">{formData.passengerCount} Billet{formData.passengerCount > 1 ? 's' : ''} {selectedReturnTrip ? '(Aller-Retour)' : '(Aller simple)'}</div>
                    <div className="text-xs font-semibold text-primary-600">
                      Sièges: {selectedSeatIds.map(id => selectedTrip.bus.seats.find(s => s.id === id)?.seatNumber).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Montant Total</div>
                  <div className="text-3xl font-bold text-gray-900 tracking-tighter">
                    {formatCurrency((selectedTrip.price + (selectedReturnTrip?.price || 0)) * formData.passengerCount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                Mode de Règlement
              </h3>

              <div className="grid gap-4">
                <label className={`
                  relative flex items-center p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-300
                  ${formData.paymentMethod === 'CASH' ? 'border-primary-600 shadow-xl shadow-primary-50' : 'border-gray-100 hover:border-primary-200'}
                `}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={formData.paymentMethod === 'CASH'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-6">
                    <div className="text-base font-bold text-gray-900">Paiement Espèces</div>
                    <div className="text-xs font-medium text-gray-500">Règlement physique direct en agence</div>
                  </div>
                  {formData.paymentMethod === 'CASH' && (
                    <div className="ml-auto">
                      <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep('seat')}
                className="px-8 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95 text-sm"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3 text-sm"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Valider la vente
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
