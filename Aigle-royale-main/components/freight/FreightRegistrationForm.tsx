'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { DEFAULT_FREIGHT_PRICE_PER_KG_FC } from '@/lib/freight-pricing'
import { ParcelLabel } from './ParcelLabel'

interface Trip {
  id: string
  departureTime: Date
  arrivalTime: Date
  /** FC/kg — dérivé de la compagnie du bus (API recherche trajets) */
  freightPricePerKg?: number
  bus: {
    name: string
    company?: { name: string } | null
  }
  route: {
    origin: string
    destination: string
  }
  stops?: Array<{
    id: string
    name: string
    city: { name: string }
  }>
}

interface FreightRegistrationFormProps {
  onSuccess: (order: any) => void
}

export function FreightRegistrationForm({ onSuccess }: FreightRegistrationFormProps) {
  const [step, setStep] = useState<'journey' | 'actors' | 'package'>('journey')
  const [formData, setFormData] = useState({
    tripId: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    weight: '',
    type: '',
    value: '',
    notes: '',
    originStopId: '',
    destinationStopId: '',
  })
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching cities:', err))
  }, [])

  useEffect(() => {
    if (searchParams.origin && searchParams.destination) {
      fetchTrips()
    }
  }, [searchParams])

  useEffect(() => {
    if (formData.tripId) {
      const selectedTrip = trips.find(t => t.id === formData.tripId)
      if (selectedTrip && selectedTrip.stops) {
        const originCity = selectedTrip.route.origin
        const destCity = selectedTrip.route.destination
        const originStops = selectedTrip.stops.filter(s => s.city.name === originCity)
        const destStops = selectedTrip.stops.filter(s => s.city.name === destCity)

        setFormData(prev => ({
          ...prev,
          originStopId: originStops.length === 1 ? originStops[0].id : '',
          destinationStopId: destStops.length === 1 ? destStops[0].id : '',
        }))
      }
    }
  }, [formData.tripId, trips])

  const fetchTrips = async () => {
    try {
      const response = await fetch(
        `/api/trips/search?origin=${encodeURIComponent(searchParams.origin)}&destination=${encodeURIComponent(searchParams.destination)}&date=${searchParams.date}`
      )
      const data = await response.json()
      setTrips(data)
    } catch (err) {
      console.error('Error fetching trips:', err)
    }
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

    try {
      const response = await fetch('/api/freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight),
          value: formData.value ? parseFloat(formData.value) : null,
          originStopId: formData.originStopId || null,
          destinationStopId: formData.destinationStopId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      // Récupérer les détails complets de la commande
      const orderResponse = await fetch(`/api/freight?trackingCode=${data.trackingCode}`)
      const orderData = await orderResponse.json()

      setLastOrder(orderData)
      setSuccess(true)
      onSuccess(orderData)

      // Reset form
      setFormData({
        tripId: '',
        senderName: '',
        senderPhone: '',
        receiverName: '',
        receiverPhone: '',
        weight: '',
        type: '',
        value: '',
        notes: '',
        originStopId: '',
        destinationStopId: '',
      })
      setLoading(false)
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  const steps = [
    {
      id: 'journey', label: 'Trajet', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'actors', label: 'Personnes', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'package', label: 'Colis', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
  ]

  const selectedTrip = trips.find((t) => t.id === formData.tripId)
  const pricePerKg = selectedTrip?.freightPricePerKg ?? DEFAULT_FREIGHT_PRICE_PER_KG_FC

  const calculateTotalPrice = () => {
    const weight = parseFloat(formData.weight) || 0
    return weight * pricePerKg
  }

  if (success && lastOrder) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-green-50 border-2 border-green-100 rounded-[2rem] p-8 text-center">
          <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100 animate-bounce">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Colis Enregistré !</h2>
          <p className="text-gray-600 font-bold max-w-md mx-auto">
            Le colis <span className="text-primary-600 font-black">#{lastOrder.trackingCode}</span> a bien été ajouté au système.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <ParcelLabel order={lastOrder} />
        </div>

        <div className="text-center pt-8 border-t border-gray-100">
          <button
            onClick={() => {
              setSuccess(false)
              setLastOrder(null)
            }}
            className="px-10 py-4 bg-gray-50 text-gray-700 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95"
          >
            Enregistrer un autre colis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-2 sm:px-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0 hidden sm:block" />
        {steps.map((s, idx) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${step === s.id
                ? 'bg-primary-600 text-white scale-110'
                : steps.findIndex(x => x.id === step) > idx
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-400'
                }`}
            >
              {steps.findIndex(x => x.id === step) > idx ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.icon}
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${step === s.id ? 'text-primary-600' : 'text-gray-400'
              }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-8 sm:p-12">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 font-medium animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* STEP 1: JOURNEY */}
          {step === 'journey' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Départ</label>
                  <div className="relative group">
                    <select
                      value={searchParams.origin}
                      onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                      className="w-full pl-5 pr-10 py-4 bg-gray-50/50 border-2 border-transparent group-hover:bg-white focus:bg-white rounded-2xl transition-all appearance-none font-bold text-gray-900 group-focus-within:border-primary-500 group-focus-within:shadow-xl group-focus-within:shadow-primary-100/50"
                    >
                      <option value="">Sélectionner</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Arrivée</label>
                  <div className="relative group">
                    <select
                      value={searchParams.destination}
                      onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                      className="w-full pl-5 pr-10 py-4 bg-gray-50/50 border-2 border-transparent group-hover:bg-white focus:bg-white rounded-2xl transition-all appearance-none font-bold text-gray-900 group-focus-within:border-primary-500 group-focus-within:shadow-xl group-focus-within:shadow-primary-100/50"
                    >
                      <option value="">Sélectionner</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                  <input
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent hover:bg-white focus:bg-white rounded-2xl transition-all font-bold text-gray-900 focus:border-primary-500 focus:shadow-xl focus:shadow-primary-100/50"
                  />
                </div>
              </div>

              {trips.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Trajets Disponibles</h3>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{trips.length} résultat(s)</span>
                  </div>
                  <div className="grid gap-4">
                    {trips.map((trip) => (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, tripId: trip.id })}
                        className={`w-full group text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden ${formData.tripId === trip.id
                          ? 'border-primary-600 bg-primary-50 shadow-xl shadow-primary-100'
                          : 'border-transparent bg-gray-50 hover:bg-white hover:border-primary-200'
                          }`}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-gray-900">{trip.route.origin}</span>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              <span className="text-lg font-black text-gray-900">{trip.route.destination}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 font-bold">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                {trip.bus.name}
                                {trip.bus.company?.name ? (
                                  <span className="font-semibold text-gray-400">· {trip.bus.company.name}</span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {format(new Date(trip.departureTime), 'HH:mm')}
                              </div>
                            </div>
                            {typeof trip.freightPricePerKg === 'number' && (
                              <p className="text-xs font-bold text-amber-700 mt-2">
                                Fret : {trip.freightPricePerKg.toLocaleString('fr-FR')} FC/kg
                              </p>
                            )}
                          </div>
                          {formData.tripId === trip.id && (
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center animate-in zoom-in">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!formData.tripId}
                  onClick={() => setStep('actors')}
                  className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-primary-600 active:scale-95 transition-all shadow-xl shadow-gray-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-3 group"
                >
                  Suivant: Acteurs
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACTORS */}
          {step === 'actors' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Expéditeur */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Expéditeur</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                      <input
                        type="text"
                        value={formData.senderName}
                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                        placeholder="Ex: Jean Dupont"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.senderPhone}
                        onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                        placeholder="Ex: 01 23 45 67 89"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Destinataire */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Destinataire</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                      <input
                        type="text"
                        value={formData.receiverName}
                        onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                        placeholder="Ex: Marie Martin"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.receiverPhone}
                        onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                        placeholder="Ex: 06 78 90 12 34"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('journey')}
                  className="px-8 py-4 text-gray-400 font-black hover:text-gray-900 transition-colors uppercase tracking-widest text-xs"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!formData.senderName || !formData.receiverName}
                  onClick={() => setStep('package')}
                  className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-primary-600 active:scale-95 transition-all shadow-xl shadow-gray-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-3 group"
                >
                  Suivant: Colis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PACKAGE */}
          {step === 'package' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Contenu & Poids</h3>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de colis</label>
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        placeholder="Ex: Documents, Sac d'habits"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poids (kg)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valeur estimée</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">FC</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes spéciales</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl transition-all font-bold text-gray-900 resize-none"
                        placeholder="Fragile, urgent, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Résumé interactif */}
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Résumé final</h3>
                  <div className="bg-gray-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Trajet</div>
                          <div className="text-lg font-bold">
                            {trips.find(t => t.id === formData.tripId)?.route.origin} → {trips.find(t => t.id === formData.tripId)?.route.destination}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Type</div>
                          <div className="text-lg font-bold">{formData.type || '—'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10">
                        <div>
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Poids</div>
                          <div className="text-2xl font-black">{formData.weight || '0'} kg</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Valeur</div>
                          <div className="text-2xl font-black">{formData.value ? `${formData.value} FC` : '—'}</div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                          <span className="text-sm font-bold text-white/60">Prix Total estimé</span>
                          <span className="text-3xl font-black text-primary-500">
                            {calculateTotalPrice().toLocaleString()} FC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('actors')}
                  className="px-8 py-4 text-gray-400 font-black hover:text-gray-900 transition-colors uppercase tracking-widest text-xs"
                >
                  Retour
                </button>
                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={loading || !formData.weight}
                    className="px-12 py-5 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 active:scale-95 transition-all shadow-xl shadow-primary-100/50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-3 animate-pulse-slow"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirmer l'envoi
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
