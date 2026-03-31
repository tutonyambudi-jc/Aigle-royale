import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'

import { AdvertisementBanner } from '@/components/advertisements/AdvertisementBanner'
import { PrintButton } from '@/components/PrintButton'
import { cookies } from 'next/headers'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'

async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          route: true,
          bus: true,
        },
      },
      seat: true,
      payment: true,
      boardingStop: {
        include: {
          city: true,
        },
      },
      alightingStop: {
        include: {
          city: true,
        },
      },
    },
  })

  return booking
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnId?: string, facture?: string, print?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const booking = await getBooking(p.id)
  const returnBooking = sp.returnId ? await getBooking(sp.returnId) : null

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
        </div>
      </div>
    )
  }

  if (booking.userId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
        </div>
      </div>
    )
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
  const bookingSubtotal = Math.max(
    0,
    (Number(booking.basePrice || booking.trip.price) - Number(booking.discountAmount || 0)) + Number(booking.extrasTotal || 0)
  )
  const bookingServiceFee = Math.max(0, Number(booking.totalPrice || booking.trip.price) - bookingSubtotal)
  const returnSubtotal = returnBooking
    ? Math.max(
      0,
      (Number(returnBooking.basePrice || returnBooking.trip.price) - Number(returnBooking.discountAmount || 0)) + Number(returnBooking.extrasTotal || 0)
    )
    : 0
  const returnServiceFee = returnBooking
    ? Math.max(0, Number(returnBooking.totalPrice || returnBooking.trip.price) - returnSubtotal)
    : 0
  const combinedSubtotal = bookingSubtotal + returnSubtotal
  const combinedServiceFee = bookingServiceFee + returnServiceFee
  const backUrl =
    session.user.role === 'AGENT'
      ? '/agent'
      : session.user.role === 'SUPER_AGENT'
        ? '/super-agent'
        : session.user.role === 'AGENCY_STAFF'
          ? '/agency'
          : '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:p-0">
      <div className="print:hidden">

      </div>
      <div className="py-8 print:py-0">
        <div className="container mx-auto px-4 print:px-0">
          <DashboardBackButton />
          <div className="max-w-3xl mx-auto">
            <style dangerouslySetInnerHTML={{
              __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-ticket, #printable-ticket * {
                        visibility: visible;
                    }
                    #printable-ticket {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    .ticket-journey-block {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    #printable-ticket {
                        border-radius: 14px;
                    }
                }
            `}} />
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center print:hidden">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h1>
              <p className="text-gray-600">Votre billet a été réservé avec succès</p>
            </div>

            {/* Billet en forme de carte — centré, coins arrondis, ombre douce */}
            <div className="mb-10 flex justify-center print:mb-0">
              <div
                id="printable-ticket"
                className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-neutral-200/90 bg-white shadow-[0_22px_50px_-18px_rgba(15,23,42,0.14)] ring-1 ring-neutral-950/[0.035] print:max-w-none print:rounded-[14px] print:border-neutral-300 print:shadow-none print:ring-0 sm:max-w-xl"
              >
              {/* Bande supérieure type carte */}
              <div className="h-1.5 bg-neutral-200/80 print:bg-neutral-300" aria-hidden />
              <header className="border-b border-neutral-200/80 px-7 py-9 md:px-10 md:py-10">
                <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-md space-y-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-neutral-400">Aigle Royale</p>
                    <h2 className="text-[1.65rem] font-light leading-snug tracking-tight text-neutral-900 md:text-[1.85rem]">
                      {sp.facture === 'true' ? 'Facture' : 'Billet électronique'}
                    </h2>
                    <p className="text-sm font-normal leading-relaxed text-neutral-500">
                      {returnBooking ? 'Aller-retour' : 'Aller simple'}
                      {sp.facture === 'true' && (
                        <span className="text-neutral-400"> · Justificatif de paiement</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-12 lg:items-end">
                    {booking.qrCode && (
                      <div className="border border-neutral-200 bg-white p-3 print:border-neutral-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={booking.qrCode}
                          alt="QR code — embarquement"
                          className="h-[7.5rem] w-[7.5rem] sm:h-32 sm:w-32"
                        />
                      </div>
                    )}
                    <div className="space-y-6 text-left sm:text-right">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">Référence</p>
                        <p className="mt-1.5 break-all font-mono text-[13px] font-medium leading-relaxed tracking-wide text-neutral-900">
                          {booking.ticketNumber}
                        </p>
                      </div>
                      {returnBooking && (
                        <div className="border-t border-neutral-100 pt-6 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">Retour</p>
                          <p className="mt-1.5 break-all font-mono text-[13px] font-medium tracking-wide text-neutral-900">
                            {returnBooking.ticketNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              <div className="px-7 py-9 md:px-10 md:py-10">
                {/* Passager */}
                <div className="ticket-journey-block grid gap-10 border-b border-neutral-100 pb-10 sm:grid-cols-2 sm:gap-16">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Passager</p>
                    <p className="mt-3 text-lg font-normal text-neutral-900">{booking.passengerName}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Véhicule</p>
                    <p className="mt-3 text-lg font-normal text-neutral-900">{booking.trip.bus.name}</p>
                  </div>
                </div>

                {/* Aller */}
                <div className="ticket-journey-block border-b border-neutral-100 py-10">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-400">Trajet — Aller</p>
                  <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-6">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Départ</p>
                      <p className="mt-2 text-xl font-normal text-neutral-900 md:text-2xl">{booking.trip.route.origin}</p>
                      <p className="mt-2 text-sm font-normal capitalize text-neutral-500">
                        {format(new Date(booking.trip.departureTime), 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                      <p className="mt-4 text-4xl font-extralight tabular-nums tracking-tight text-neutral-900">
                        {format(new Date(booking.trip.departureTime), 'HH:mm')}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-end gap-4 pb-1">
                      <div className="hidden h-px w-8 bg-neutral-200 md:block" aria-hidden />
                      <svg
                        className="h-5 w-5 text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-700 print:bg-white">
                        Siège {booking.seat.seatNumber}
                      </span>
                    </div>
                    <div className="md:text-right">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Arrivée</p>
                      <p className="mt-2 text-xl font-normal text-neutral-900 md:text-2xl">{booking.trip.route.destination}</p>
                      <p className="mt-2 text-sm font-normal capitalize text-neutral-500">
                        {format(new Date(booking.trip.arrivalTime), 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                      <p className="mt-4 text-4xl font-extralight tabular-nums tracking-tight text-neutral-900">
                        {format(new Date(booking.trip.arrivalTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  {(booking.boardingStop || booking.alightingStop) && (
                    <div className="mt-10 grid gap-8 border-t border-neutral-100 pt-8 sm:grid-cols-2 sm:gap-12">
                      {booking.boardingStop && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Embarquement</p>
                          <p className="mt-2 text-sm font-normal text-neutral-800">{booking.boardingStop.name}</p>
                        </div>
                      )}
                      {booking.alightingStop && (
                        <div className={booking.boardingStop ? 'sm:text-right' : ''}>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Débarquement</p>
                          <p className="mt-2 text-sm font-normal text-neutral-800">{booking.alightingStop.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Retour */}
                {returnBooking && (
                  <div className="ticket-journey-block border-b border-neutral-100 py-10">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-400">Trajet — Retour</p>
                    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-6">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Départ</p>
                        <p className="mt-2 text-xl font-normal text-neutral-900 md:text-2xl">{returnBooking.trip.route.origin}</p>
                        <p className="mt-2 text-sm font-normal capitalize text-neutral-500">
                          {format(new Date(returnBooking.trip.departureTime), 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="mt-4 text-4xl font-extralight tabular-nums tracking-tight text-neutral-900">
                          {format(new Date(returnBooking.trip.departureTime), 'HH:mm')}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-end gap-4 pb-1">
                        <div className="hidden h-px w-8 bg-neutral-200 md:block" aria-hidden />
                        <svg
                          className="h-5 w-5 text-neutral-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-700 print:bg-white">
                          Siège {returnBooking.seat.seatNumber}
                        </span>
                      </div>
                      <div className="md:text-right">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Arrivée</p>
                        <p className="mt-2 text-xl font-normal text-neutral-900 md:text-2xl">{returnBooking.trip.route.destination}</p>
                        <p className="mt-2 text-sm font-normal capitalize text-neutral-500">
                          {format(new Date(returnBooking.trip.arrivalTime), 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="mt-4 text-4xl font-extralight tabular-nums tracking-tight text-neutral-900">
                          {format(new Date(returnBooking.trip.arrivalTime), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    {(returnBooking.boardingStop || returnBooking.alightingStop) && (
                      <div className="mt-10 grid gap-8 border-t border-neutral-100 pt-8 sm:grid-cols-2 sm:gap-12">
                        {returnBooking.boardingStop && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Embarquement</p>
                            <p className="mt-2 text-sm font-normal text-neutral-800">{returnBooking.boardingStop.name}</p>
                          </div>
                        )}
                        {returnBooking.alightingStop && (
                          <div className={returnBooking.boardingStop ? 'sm:text-right' : ''}>
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Débarquement</p>
                            <p className="mt-2 text-sm font-normal text-neutral-800">{returnBooking.alightingStop.name}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Paiement */}
                {(booking.payment || (returnBooking && returnBooking.payment)) && (
                  <div className="ticket-journey-block flex flex-col gap-8 pt-10 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3 text-sm text-neutral-600">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Paiement</p>
                      <p className="font-normal text-neutral-800">
                        {booking.payment?.method === 'MOBILE_MONEY'
                          ? 'Mobile Money'
                          : booking.payment?.method === 'CARD'
                            ? 'Carte bancaire'
                            : 'Espèces'}
                      </p>
                      <p className="text-sm">
                        Sous-total{' '}
                        <span className="font-medium text-neutral-900">{formatCurrency(combinedSubtotal, currency)}</span>
                      </p>
                      <p className="text-sm">
                        Frais de service{' '}
                        <span className="font-medium text-neutral-900">{formatCurrency(combinedServiceFee, currency)}</span>
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 pt-6 text-left sm:border-t-0 sm:border-l sm:pl-10 sm:pt-0 sm:text-right">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Total</p>
                      <p className="mt-2 text-3xl font-light tabular-nums tracking-tight text-neutral-900">
                        {formatCurrency(
                          (booking.payment?.amount || 0) + (returnBooking?.payment?.amount || 0),
                          currency
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Advertisement Banner */}
            <div className="mb-6 print:hidden">
              <AdvertisementBanner type="BANNER_CONFIRMATION" />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
              <PrintButton label="Imprimer le billet" className="w-full flex-1" />
              <a
                href="/"
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-100 text-center"
              >
                Nouvelle recherche
              </a>
              <a
                href={backUrl}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border border-gray-200"
              >
                Tableau de bord
              </a>
            </div>
          </div>
        </div>
      </div>
      {sp.print === 'true' && (
        <script dangerouslySetInnerHTML={{
          __html: `
              window.onload = () => {
                  setTimeout(() => {
                      window.print();
                  }, 1000);
              };
          `}} />
      )}
    </div>
  )
}
