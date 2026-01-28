import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
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
          <div className="max-w-2xl mx-auto">
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

            {/* Ticket Container */}
            <div id="printable-ticket" className="bg-white rounded-lg shadow-lg p-6 mb-6 print:shadow-none print:p-0 print:m-0 border-2 border-dashed border-primary-300 print:border-none">
              <div className="print:p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Aigle Royale</h2>
                    <p className="text-sm text-gray-600">{sp.facture === 'true' ? 'FACTURE OFFICIELLE' : 'Billet électronique'} — {returnBooking ? 'Aller-Retour' : 'Aller Simple'}</p>
                    {sp.facture === 'true' && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Preuve de paiement / Justificatif</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">N° de billet</div>
                    <div className="text-lg font-bold text-primary-600">{booking.ticketNumber}</div>
                    {returnBooking && (
                      <div className="text-xs text-gray-400 mt-1">Retour: {returnBooking.ticketNumber}</div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                {booking.qrCode && (
                  <div className="flex justify-center mb-6 print:mb-4">
                    <div className="bg-white p-2 rounded-lg border-2 border-gray-100">
                      <img src={booking.qrCode} alt="QR Code" className="w-32 h-32" />
                    </div>
                  </div>
                )}

                {/* PASSENGER & BUS INFO */}
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Passager</div>
                    <div className="text-base font-semibold">{booking.passengerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-bold">Bus</div>
                    <div className="text-base font-semibold">{booking.trip.bus.name}</div>
                  </div>
                </div>

                {/* OUTBOUND SECTION */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded uppercase tracking-wider">
                      Trajet Aller
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase font-bold">Départ</div>
                      <div className="text-lg font-bold">{booking.trip.route.origin}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.trip.departureTime), 'dd MMMM yyyy')}
                      </div>
                      <div className="text-lg font-black text-primary-600">
                        {format(new Date(booking.trip.departureTime), 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div className="text-[10px] font-bold text-gray-400 mt-1">Siège: {booking.seat.seatNumber}</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-xs text-gray-500 uppercase font-bold">Arrivée</div>
                      <div className="text-lg font-bold">{booking.trip.route.destination}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.trip.arrivalTime), 'dd MMMM yyyy')}
                      </div>
                      <div className="text-lg font-black text-gray-900">
                        {format(new Date(booking.trip.arrivalTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RETURN SECTION (IF APPLICABLE) */}
                {returnBooking && (
                  <div className="mb-8 pt-6 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
                        Trajet Retour
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Départ</div>
                        <div className="text-lg font-bold">{returnBooking.trip.route.origin}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(returnBooking.trip.departureTime), 'dd MMMM yyyy')}
                        </div>
                        <div className="text-lg font-black text-green-600">
                          {format(new Date(returnBooking.trip.departureTime), 'HH:mm')}
                        </div>
                      </div>
                      <div className="flex flex-col items-center px-4">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">Siège: {returnBooking.seat.seatNumber}</div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-xs text-gray-500 uppercase font-bold">Arrivée</div>
                        <div className="text-lg font-bold">{returnBooking.trip.route.destination}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(returnBooking.trip.arrivalTime), 'dd MMMM yyyy')}
                        </div>
                        <div className="text-lg font-black text-gray-900">
                          {format(new Date(returnBooking.trip.arrivalTime), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                {(booking.payment || (returnBooking && returnBooking.payment)) && (
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Paiement</div>
                      <div className="text-sm text-gray-600">
                        Méthode: {booking.payment?.method === 'MOBILE_MONEY' ? 'Mobile Money' :
                          booking.payment?.method === 'CARD' ? 'Carte bancaire' : 'Espèces'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-bold">Total Payé</div>
                      <div className="text-2xl font-black text-primary-600">
                        {formatCurrency(
                          (booking.payment?.amount || 0) + (returnBooking?.payment?.amount || 0),
                          currency
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
