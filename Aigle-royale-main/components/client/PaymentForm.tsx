'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

interface Booking {
  id: string
  ticketNumber: string
  totalPrice: number
  basePrice?: number
  discountAmount?: number
  extrasTotal?: number
  trip: {
    price: number
    route: {
      origin: string
      destination: string
    }
  }
}

interface PaymentFormProps {
  booking: Booking
  currency: DisplayCurrency
}

export function PaymentForm({ booking, currency }: PaymentFormProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD' | 'CASH'>('MOBILE_MONEY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const basePrice = Number.isFinite(booking.basePrice as number) ? Number(booking.basePrice) : booking.trip.price
  const discountAmount = Number.isFinite(booking.discountAmount as number) ? Number(booking.discountAmount) : 0
  const extrasTotal = Number.isFinite(booking.extrasTotal as number) ? Number(booking.extrasTotal) : 0
  const subtotal = Math.max(0, basePrice - discountAmount + extrasTotal)
  const total = booking.totalPrice || booking.trip.price
  const serviceFee = Math.max(0, total - subtotal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.details || data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      router.push(`/bookings/${booking.id}/confirmation`)
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Booking Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Résumé de la réservation</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Trajet:</span>
            <span className="font-semibold">
              {booking.trip.route.origin} → {booking.trip.route.destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Numéro de billet:</span>
            <span className="font-semibold">{booking.ticketNumber}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">Sous-total billet:</span>
            <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Frais de service:</span>
            <span className="font-semibold">{formatCurrency(serviceFee, currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t">
            <span>Total à payer:</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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
                <div className="text-sm text-gray-600">Vous paierez lors du retrait du billet</div>
              </div>
            </label>
          </div>
        </div>

        {paymentMethod === 'MOBILE_MONEY' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous serez redirigé vers votre application Mobile Money pour finaliser le paiement.
            </p>
          </div>
        )}

        {paymentMethod === 'CARD' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous serez redirigé vers une page de paiement sécurisée.
            </p>
          </div>
        )}

        {paymentMethod === 'CASH' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">⚠️ Important:</span> Vous devez effectuer le paiement en agence dans les <span className="font-bold">2 heures</span>. Passé ce délai, votre réservation sera automatiquement annulée.
              <br className="my-2" />
              Vous devrez vous présenter en agence avec votre pièce d'identité pour finaliser le paiement et récupérer votre billet.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Traitement...' : 'Payer'}
          </button>
        </div>
      </form>
    </div>
  )
}
