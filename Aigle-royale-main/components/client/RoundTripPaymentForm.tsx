'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

interface Booking {
    id: string
    ticketNumber: string
    totalPrice: number
    passengerName: string
    seat: { seatNumber: string }
    trip: {
        price: number
        departureTime: Date
        route: {
            origin: string
            destination: string
        }
        bus: { name: string }
    }
}

interface RoundTripPaymentFormProps {
    outboundBooking: Booking
    returnBooking: Booking
    currency: DisplayCurrency
}

export function RoundTripPaymentForm({ outboundBooking, returnBooking, currency }: RoundTripPaymentFormProps) {
    const router = useRouter()
    const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD' | 'CASH'>('CASH')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const totalPrice = (outboundBooking.totalPrice || outboundBooking.trip.price) +
        (returnBooking.totalPrice || returnBooking.trip.price)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Pay for outbound booking
            const outboundRes = await fetch(`/api/bookings/${outboundBooking.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: paymentMethod }),
            })

            if (!outboundRes.ok) {
                const data = await outboundRes.json()
                throw new Error(data.details || data.error || 'Erreur paiement aller')
            }

            // Pay for return booking
            const returnRes = await fetch(`/api/bookings/${returnBooking.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: paymentMethod }),
            })

            if (!returnRes.ok) {
                const data = await returnRes.json()
                throw new Error(data.details || data.error || 'Erreur paiement retour')
            }

            // Redirect to confirmation
            router.push(`/bookings/${outboundBooking.id}/confirmation?returnId=${returnBooking.id}`)
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue')
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
                <h2 className="text-xl font-bold mb-4">Récapitulatif de votre voyage</h2>

                <div className="space-y-4">
                    {/* Outbound */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            ALLER
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold">{outboundBooking.trip.route.origin} → {outboundBooking.trip.route.destination}</div>
                                <div className="text-sm opacity-90">
                                    {format(new Date(outboundBooking.trip.departureTime), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </div>
                                <div className="text-sm opacity-75">
                                    Billet: {outboundBooking.ticketNumber} • Siège: {outboundBooking.seat.seatNumber}
                                </div>
                            </div>
                            <div className="text-lg font-bold">
                                {formatCurrency(outboundBooking.totalPrice || outboundBooking.trip.price, currency)}
                            </div>
                        </div>
                    </div>

                    {/* Return */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            RETOUR
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold">{returnBooking.trip.route.origin} → {returnBooking.trip.route.destination}</div>
                                <div className="text-sm opacity-90">
                                    {format(new Date(returnBooking.trip.departureTime), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </div>
                                <div className="text-sm opacity-75">
                                    Billet: {returnBooking.ticketNumber} • Siège: {returnBooking.seat.seatNumber}
                                </div>
                            </div>
                            <div className="text-lg font-bold">
                                {formatCurrency(returnBooking.totalPrice || returnBooking.trip.price, currency)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                    <span className="text-lg font-medium">Total à payer</span>
                    <span className="text-3xl font-black">{formatCurrency(totalPrice, currency)}</span>
                </div>
            </div>

            {/* Payment Form */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'CASH' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="CASH"
                                    checked={paymentMethod === 'CASH'}
                                    onChange={(e) => setPaymentMethod(e.target.value as 'CASH')}
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">Paiement en agence</div>
                                    <div className="text-sm text-gray-600">Payez lors du retrait de vos billets</div>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'MOBILE_MONEY' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="MOBILE_MONEY"
                                    checked={paymentMethod === 'MOBILE_MONEY'}
                                    onChange={(e) => setPaymentMethod(e.target.value as 'MOBILE_MONEY')}
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">Mobile Money</div>
                                    <div className="text-sm text-gray-600">Orange Money, MTN Mobile Money, etc.</div>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'CARD' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="CARD"
                                    checked={paymentMethod === 'CARD'}
                                    onChange={(e) => setPaymentMethod(e.target.value as 'CARD')}
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">Carte bancaire</div>
                                    <div className="text-sm text-gray-600">Visa, Mastercard</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <span className="font-bold">⚠️ Important:</span> Vous devez effectuer le paiement en agence dans les <span className="font-bold">2 heures</span>. Passé ce délai, vos réservations seront automatiquement annulées.
                                <br className="my-2" />
                                Vous devrez vous présenter en agence avec votre pièce d'identité pour finaliser le paiement et récupérer vos billets.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                        >
                            Retour
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Traitement...' : `Payer ${formatCurrency(totalPrice, currency)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
