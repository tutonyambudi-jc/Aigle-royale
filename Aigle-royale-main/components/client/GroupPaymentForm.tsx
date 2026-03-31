'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

interface BookingGroup {
  id: string
  totalAmount: number
  status: string
  paymentStatus: string
  bookings: Array<{
    id: string
    ticketNumber: string
    totalPrice: number
    basePrice?: number
    discountAmount?: number
    extrasTotal?: number
    passengerName: string
    passengerType: string
    trip: {
      price: number
      departureTime: Date
      route: {
        origin: string
        destination: string
      }
      bus: {
        name: string
      }
    }
    seat: {
      seatNumber: string
    }
  }>
  payment?: {
    id: string
    status: string
  } | null
}

interface GroupPaymentFormProps {
  bookingGroup: BookingGroup
  displayCurrency: DisplayCurrency
}

export function GroupPaymentForm({ bookingGroup, displayCurrency }: GroupPaymentFormProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD' | 'CASH'>('MOBILE_MONEY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totals = bookingGroup.bookings.reduce(
    (acc, booking) => {
      const basePrice = Number.isFinite(booking.basePrice as number) ? Number(booking.basePrice) : booking.trip.price
      const discountAmount = Number.isFinite(booking.discountAmount as number) ? Number(booking.discountAmount) : 0
      const extrasTotal = Number.isFinite(booking.extrasTotal as number) ? Number(booking.extrasTotal) : 0
      const subtotal = Math.max(0, basePrice - discountAmount + extrasTotal)
      const total = Number(booking.totalPrice || booking.trip.price)
      const serviceFee = Math.max(0, total - subtotal)
      return {
        subtotal: acc.subtotal + subtotal,
        serviceFee: acc.serviceFee + serviceFee,
      }
    },
    { subtotal: 0, serviceFee: 0 }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/booking-groups/${bookingGroup.id}/payment`, {
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

      router.push(`/booking-groups/${bookingGroup.id}/confirmation`)
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  // Group bookings by trip
  const tripGroups = bookingGroup.bookings.reduce((acc, booking) => {
    const tripId = `${booking.trip.route.origin}-${booking.trip.route.destination}-${booking.trip.departureTime}`
    if (!acc[tripId]) {
      acc[tripId] = {
        trip: booking.trip,
        bookings: [],
      }
    }
    acc[tripId].bookings.push(booking)
    return acc
  }, {} as Record<string, { trip: any; bookings: any[] }>)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Booking Summary */}
      <div className="mb-6 p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Résumé de votre réservation</h2>
        
        {Object.values(tripGroups).map((group, idx) => (
          <div key={idx} className="mb-6 last:mb-0">
            <div className="mb-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {group.trip.route.origin} → {group.trip.route.destination}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(group.trip.departureTime), 'dd MMMM yyyy à HH:mm')}
                  </p>
                  <p className="text-sm text-gray-600">Bus: {group.trip.bus.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{group.bookings.length} passager{group.bookings.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Passenger details */}
            <div className="space-y-2 pl-4">
              {group.bookings.map((booking) => {
                const typeLabel = booking.passengerType === 'ADULT' ? '👨‍💼 Adulte'
                  : booking.passengerType === 'CHILD' ? '👶 Enfant'
                  : booking.passengerType === 'INFANT' ? '🍼 Bébé'
                  : '👴 Senior'
                
                return (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{booking.passengerName}</div>
                      <div className="text-sm text-gray-600">{typeLabel} • Siège {booking.seat.seatNumber} • {booking.ticketNumber}</div>
                    </div>
                    <div className="text-right font-semibold text-gray-900">
                      {formatCurrency(booking.totalPrice, displayCurrency)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t-2 border-primary-300">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-gray-600">Total pour {bookingGroup.bookings.length} billet{bookingGroup.bookings.length > 1 ? 's' : ''}</div>
              <div className="text-xs text-gray-500">Tous les passagers et frais inclus</div>
            </div>
            <div className="text-3xl font-black text-primary-600">
              {formatCurrency(bookingGroup.totalAmount, displayCurrency)}
            </div>
          </div>
          <div className="text-sm space-y-1 bg-white/70 rounded-lg p-3 border border-primary-100">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total billets</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.subtotal, displayCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frais de service</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.serviceFee, displayCurrency)}</span>
            </div>
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
                <div className="text-sm text-gray-600">Orange Money, MTN Mobile Money, Airtel Money</div>
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
                <div className="text-sm text-gray-600">Vous paierez lors du retrait des billets</div>
              </div>
            </label>
          </div>
        </div>

        {paymentMethod === 'MOBILE_MONEY' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous serez redirigé vers votre application Mobile Money pour finaliser le paiement du montant total de <span className="font-bold">{formatCurrency(bookingGroup.totalAmount, displayCurrency)}</span>.
            </p>
          </div>
        )}

        {paymentMethod === 'CARD' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous serez redirigé vers une page de paiement sécurisée pour régler le montant total de <span className="font-bold">{formatCurrency(bookingGroup.totalAmount, displayCurrency)}</span>.
            </p>
          </div>
        )}

        {paymentMethod === 'CASH' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">⚠️ Important:</span> Vous devez effectuer le paiement en agence dans les <span className="font-bold">2 heures</span>. Passé ce délai, votre réservation sera automatiquement annulée.
              <br className="my-2" />
              Montant à payer: <span className="font-bold">{formatCurrency(bookingGroup.totalAmount, displayCurrency)}</span>
              <br />
              Vous devrez vous présenter en agence avec votre pièce d'identité pour finaliser le paiement et récupérer tous vos billets.
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
            {loading ? 'Traitement...' : `Payer ${formatCurrency(bookingGroup.totalAmount, displayCurrency)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
