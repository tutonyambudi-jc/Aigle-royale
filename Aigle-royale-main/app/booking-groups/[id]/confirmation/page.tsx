import React from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { TicketList } from '@/components/TicketList'
import { AdvertisementBanner } from '@/components/advertisements/AdvertisementBanner'

// Helper function for currency formatting
const formatCurrency = (amount: number, currency = 'XOF') => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

export default async function BookingGroupConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const bookingGroup = await prisma.bookingGroup.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          seat: true,
          trip: {
            include: {
              route: true,
              bus: true,
            }
          }
        }
      },
      payment: true
    }
  })

  // If not found, 404
  if (!bookingGroup) {
    notFound()
  }

  const isPaid = bookingGroup.status === 'CONFIRMED' || bookingGroup.payment?.status === 'COMPLETED' || bookingGroup.payment?.status === 'PAID'
  const totals = bookingGroup.bookings.reduce(
    (acc, booking) => {
      const basePrice = Number(booking.basePrice || booking.trip.price)
      const discountAmount = Number(booking.discountAmount || 0)
      const extrasTotal = Number(booking.extrasTotal || 0)
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

  // Basic currency (could be dynamic based on trip)
  const currency = 'XOF'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Réservation Confirmée !</h1>
          <p className="text-lg text-gray-600">
            Votre voyage de <span className="font-semibold text-blue-700">{bookingGroup.bookings[0].trip.route.origin}</span> à <span className="font-semibold text-blue-700">{bookingGroup.bookings[0].trip.route.destination}</span> est prêt.
          </p>
        </div>

        {/* Trip Summary & Tickets */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Trip Summary Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {bookingGroup.bookings[0].trip.route.origin}
                  <span className="text-blue-300">➜</span>
                  {bookingGroup.bookings[0].trip.route.destination}
                </h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-blue-100">
                  <span className="flex items-center gap-1">
                    📅 {format(new Date(bookingGroup.bookings[0].trip.departureTime), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1">
                    🚌 {bookingGroup.bookings[0].trip.bus.name}
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold border border-white/30">
                {bookingGroup.bookings.length} Billet{bookingGroup.bookings.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Ticket List */}
          <div className="p-6 bg-gray-50/50">
            <TicketList bookings={bookingGroup.bookings} currency={currency} />
          </div>

          {/* Total & Status Footer */}
          <div className="bg-white p-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Montant Total</div>
                <div className="text-3xl font-black text-blue-900">{formatCurrency(bookingGroup.totalAmount, currency)}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Sous-total: <span className="font-semibold text-gray-700">{formatCurrency(totals.subtotal, currency)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Frais de service: <span className="font-semibold text-gray-700">{formatCurrency(totals.serviceFee, currency)}</span>
                </div>
              </div>

              {isPaid ? (
                <div className="flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <div className="font-bold">Paiement confirmé</div>
                    {bookingGroup.payment?.paidAt && (
                      <div className="text-xs opacity-75">Le {format(new Date(bookingGroup.payment.paidAt), 'dd/MM/yyyy à HH:mm')}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-bold">
                  En attente de paiement
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advertisement */}
        <AdvertisementBanner type="BANNER_CONFIRMATION" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Voir mes réservations
          </Link>
          <Link
            href="/"
            className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-center hover:border-gray-300"
          >
            Nouvelle recherche
          </Link>
        </div>

      </div>
    </div>
  )
}
// Force refresh
