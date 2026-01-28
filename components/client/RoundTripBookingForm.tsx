'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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
}

interface RoundTripBookingFormProps {
    outboundTrip: Trip
    returnTrip: Trip
    outboundSeats: Seat[]
    returnSeats: Seat[]
    displayCurrency?: DisplayCurrency
    user?: {
        firstName: string
        lastName: string
        email: string
        phone?: string | null
    } | null
}

export function RoundTripBookingForm({
    outboundTrip,
    returnTrip,
    outboundSeats,
    returnSeats,
    displayCurrency = 'FC',
    user,
}: RoundTripBookingFormProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [step, setStep] = useState<'passenger' | 'seats' | 'payment'>('passenger')
    const [selectedOutboundSeat, setSelectedOutboundSeat] = useState<string | null>(null)
    const [selectedReturnSeat, setSelectedReturnSeat] = useState<string | null>(null)
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

    const totalPrice = outboundTrip.price + returnTrip.price

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

        if (!selectedOutboundSeat || !selectedReturnSeat) {
            setError('Veuillez sélectionner un siège pour chaque trajet')
            return
        }

        if (!formData.passengerName || !formData.passengerCity) {
            setError('Veuillez remplir tous les champs obligatoires')
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

            // Create outbound booking
            const outboundResponse = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: outboundTrip.id,
                    seatId: selectedOutboundSeat,
                    passengerName: formData.passengerName,
                    passengerPhone: formData.passengerPhone,
                    passengerEmail: formData.passengerEmail,
                    passengerAddress,
                    isRoundTrip: true,
                }),
            })

            const outboundData = await outboundResponse.json()

            if (!outboundResponse.ok) {
                setError(outboundData.error || 'Erreur lors de la réservation aller')
                setLoading(false)
                return
            }

            // Create return booking
            const returnResponse = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: returnTrip.id,
                    seatId: selectedReturnSeat,
                    passengerName: formData.passengerName,
                    passengerPhone: formData.passengerPhone,
                    passengerEmail: formData.passengerEmail,
                    passengerAddress,
                    isRoundTrip: true,
                    linkedBookingId: outboundData.bookingId,
                }),
            })

            const returnData = await returnResponse.json()

            if (!returnResponse.ok) {
                setError(returnData.error || 'Erreur lors de la réservation retour')
                setLoading(false)
                return
            }

            // Redirect to combined payment page
            router.push(`/bookings/round-trip-payment?outboundId=${outboundData.bookingId}&returnId=${returnData.bookingId}`)
        } catch (err) {
            setError('Une erreur est survenue')
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {!user && mounted && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                </div>
            )}

            {/* Trip Summary */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Récapitulatif Aller-Retour</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Outbound */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <span className="font-semibold">ALLER</span>
                        </div>
                        <div className="text-lg font-bold">{outboundTrip.route.origin} → {outboundTrip.route.destination}</div>
                        <div className="text-sm opacity-90">
                            {format(new Date(outboundTrip.departureTime), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                        <div className="text-sm opacity-75 mt-1">{outboundTrip.bus.name}</div>
                        <div className="text-xl font-bold mt-2">{formatCurrency(outboundTrip.price, displayCurrency)}</div>
                    </div>

                    {/* Return */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            <span className="font-semibold">RETOUR</span>
                        </div>
                        <div className="text-lg font-bold">{returnTrip.route.origin} → {returnTrip.route.destination}</div>
                        <div className="text-sm opacity-90">
                            {format(new Date(returnTrip.departureTime), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                        <div className="text-sm opacity-75 mt-1">{returnTrip.bus.name}</div>
                        <div className="text-xl font-bold mt-2">{formatCurrency(returnTrip.price, displayCurrency)}</div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-lg">Total à payer</span>
                    <span className="text-3xl font-black">{formatCurrency(totalPrice, displayCurrency)}</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
                {['passenger', 'seats', 'payment'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === s ? 'bg-primary-600 text-white' :
                            ['passenger', 'seats', 'payment'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {i + 1}
                        </div>
                        {i < 2 && <div className="w-16 h-1 bg-gray-200 mx-2"></div>}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
                {/* Step 1: Passenger Info */}
                {step === 'passenger' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">Informations du passager</h3>
                        <p className="text-gray-600 text-sm">Ces informations seront utilisées pour les deux trajets.</p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                                <input
                                    type="text"
                                    value={formData.passengerName}
                                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.passengerPhone}
                                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.passengerEmail}
                                    onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                                <input
                                    type="text"
                                    value={formData.passengerCity}
                                    onChange={(e) => setFormData({ ...formData, passengerCity: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                <select
                                    value={formData.passengerCountry}
                                    onChange={(e) => setFormData({ ...formData, passengerCountry: e.target.value as CountryCode })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    {COUNTRY_CODES.map((code) => (
                                        <option key={code} value={code}>{getCountryLabel(code)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setStep('seats')}
                                disabled={!formData.passengerName || !formData.passengerCity}
                                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuer
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Seat Selection */}
                {step === 'seats' && (
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-gray-900">Sélection des sièges</h3>


                        {/* Outbound Seat */}
                        <div className="space-y-4">
                            <div className="flex gap-8 items-start">
                                {/* Bus on the left */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-gray-900">Siège ALLER: {outboundTrip.route.origin} → {outboundTrip.route.destination}</span>
                                    </div>
                                    <SeatMap
                                        seats={outboundSeats}
                                        selectedSeat={selectedOutboundSeat}
                                        onSeatSelect={setSelectedOutboundSeat}
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
                                            <div className={`px-4 py-3 rounded-xl text-center font-black shadow-sm ${outboundSeats.length <= 5
                                                ? 'bg-rose-500 text-white animate-pulse'
                                                : 'bg-primary-50 text-primary-700'}`}>
                                                {outboundSeats.length} sièges restants
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Return Seat */}
                        <div className="space-y-4">
                            <div className="flex gap-8 items-start">
                                {/* Bus on the left */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-gray-900">Siège RETOUR: {returnTrip.route.origin} → {returnTrip.route.destination}</span>
                                    </div>
                                    <SeatMap
                                        seats={returnSeats}
                                        selectedSeat={selectedReturnSeat}
                                        onSeatSelect={setSelectedReturnSeat}
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
                                            <div className={`px-4 py-3 rounded-xl text-center font-black shadow-sm ${returnSeats.length <= 5
                                                ? 'bg-rose-500 text-white animate-pulse'
                                                : 'bg-green-50 text-green-700'}`}>
                                                {returnSeats.length} sièges restants
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStep('passenger')}
                                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                            >
                                Retour
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedOutboundSeat || !selectedReturnSeat}
                                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Traitement...' : 'Confirmer et payer'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
