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

const formatCurrency = (amount: number, currency: 'FC' | 'USD' = 'FC') => {
  const intlCurrency = currency === 'FC' ? 'XOF' : 'USD'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: intlCurrency }).format(amount)
}

/** Affichage propre des noms de villes (ex. kinshasa → Kinshasa) */
function formatPlaceLabel(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
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

  const currency: 'FC' | 'USD' = 'FC'

  const first = bookingGroup.bookings[0]
  const origin = formatPlaceLabel(first.trip.route.origin)
  const destination = formatPlaceLabel(first.trip.route.destination)
  const departureDate = format(new Date(first.trip.departureTime), 'EEEE d MMMM yyyy', { locale: fr })
  const departureTime = format(new Date(first.trip.departureTime), 'HH:mm', { locale: fr })

  return (
    <div className="min-h-screen bg-[#f7f6f3] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center border-b border-slate-200/80 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
            Aigle Royale — Transport
          </p>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-slate-300 bg-white mb-4">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight font-serif">
            Confirmation de réservation
          </h1>
          <p className="mt-3 text-slate-600 text-base leading-relaxed max-w-md mx-auto">
            Votre dossier a bien été enregistré. Itinéraire :{' '}
            <span className="text-slate-900 font-medium">{origin}</span>
            <span className="text-slate-400 mx-1.5" aria-hidden>
              —
            </span>
            <span className="text-slate-900 font-medium">{destination}</span>.
          </p>
        </header>

        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Ligne</p>
                <p className="text-lg font-medium text-slate-900">
                  {origin} <span className="text-slate-400 font-normal">→</span> {destination}
                </p>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <dt className="text-slate-500 shrink-0">Date et heure de départ</dt>
                    <dd className="font-medium text-slate-800">
                      {departureDate}, {departureTime}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <dt className="text-slate-500 shrink-0">Véhicule</dt>
                    <dd className="font-medium text-slate-800">{first.trip.bus.name}</dd>
                  </div>
                </dl>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Passagers</p>
                <p className="text-lg font-medium tabular-nums text-slate-900">
                  {bookingGroup.bookings.length} billet{bookingGroup.bookings.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#fafaf8] border-b border-slate-100">
            <TicketList bookings={bookingGroup.bookings} currency={currency} />
          </div>

          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Montant total</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
                  {formatCurrency(bookingGroup.totalAmount, currency)}
                </p>
                <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                  <p>
                    Sous-total :{' '}
                    <span className="text-slate-700 tabular-nums">{formatCurrency(totals.subtotal, currency)}</span>
                  </p>
                  <p>
                    Frais de service :{' '}
                    <span className="text-slate-700 tabular-nums">{formatCurrency(totals.serviceFee, currency)}</span>
                  </p>
                </div>
              </div>

              {isPaid ? (
                <div className="flex items-start gap-3 px-4 py-3 border border-slate-200 bg-white max-w-xs">
                  <svg className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Paiement enregistré</p>
                    {bookingGroup.payment?.paidAt && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(bookingGroup.payment.paidAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 border border-amber-200/80 bg-amber-50/50 text-sm text-amber-950 max-w-xs">
                  <p className="font-semibold">Paiement en attente</p>
                  <p className="text-xs text-amber-900/80 mt-1">Finalisez le règlement pour confirmer définitivement votre dossier.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <AdvertisementBanner type="BANNER_CONFIRMATION" />

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex justify-center items-center px-6 py-2.5 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors border border-slate-900"
          >
            Mes réservations
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center px-6 py-2.5 bg-white text-slate-800 text-sm font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Nouvelle recherche
          </Link>
        </div>
      </div>
    </div>
  )
}
