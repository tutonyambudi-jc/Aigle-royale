import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining } from '@/lib/booking-utils'
import { CancelBookingButton } from '@/components/reservations/CancelBookingButton'
import { PrintInvoiceButton } from '@/components/reservations/PrintInvoiceButton'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'

import {
  MapPin,
  Calendar,
  Clock,
  User,
  Bus,
  ChevronRight,
  Search,
  ArrowRight,
  Inbox,
  CreditCard,
  Ticket,
  AlertTriangle,
  Info
} from 'lucide-react'

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  // Réservations voyageurs
  if (session.user.role !== 'CLIENT') {
    redirect('/dashboard')
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  const status = (sp?.status || 'ALL').toUpperCase() as StatusFilter
  const where: any = { userId: session.user.id }
  if (status !== 'ALL') where.status = status

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      trip: { include: { route: true, bus: true } },
      seat: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const tab = (label: string, value: StatusFilter, icon: any) => {
    const Icon = icon
    return (
      <Link
        key={value}
        href={value === 'ALL' ? '/reservations' : `/reservations?status=${value}`}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${status === value
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
          : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
      >
        <Icon size={16} />
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardBackButton />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Mes <span className="text-primary-600">Voyages</span>
            </h1>
            <p className="text-gray-500 text-lg flex items-center gap-2">
              Consultez, payez ou gérez vos réservations Aigle Royale.
            </p>
          </div>

          <Link
            href="/#search"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black hover:scale-[1.02] transition-all shadow-xl hover:shadow-gray-200"
          >
            <Search size={20} />
            Nouvelle réservation
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-10 pb-2 overflow-x-auto no-scrollbar">
          {tab('Tous', 'ALL', Inbox)}
          {tab('En attente', 'PENDING', Clock)}
          {tab('Confirmés', 'CONFIRMED', Ticket)}
          {tab('Annulés', 'CANCELLED', ArrowRight)}
        </div>

        {/* Payment Policy Reminder */}
        {bookings.some(b => b.status === 'PENDING') && (
          <div className="mb-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Info className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 leading-none mb-2">Règles de paiement en ligne</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                • Pour les voyages dans <span className="font-bold">plus de 5 jours</span>, vous avez <span className="font-bold">24 heures</span> pour régler votre billet.<br />
                • Pour les voyages dans <span className="font-bold">moins de 48 heures</span>, le paiement doit être effectué dans les <span className="font-bold">2 heures</span> suivant la réservation.<br />
                Au-delà de ces délais, votre réservation sera <span className="font-bold">automatiquement annulée</span> pour libérer le siège.
              </p>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="text-gray-300" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun voyage pour le moment</h3>
            <p className="text-gray-500 mb-8 max-w-sm">Explorez nos destinations et profitez d'un voyage premium avec Aigle Royale.</p>
            <Link href="/#search" className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-100">
              Explorer les trajets
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-1 gap-6">
            {bookings.map((b) => {
              const timeRemaining = getPaymentTimeRemaining(b as any)

              const badge =
                b.status === 'CONFIRMED'
                  ? 'bg-green-50 text-green-700'
                  : b.status === 'PENDING'
                    ? timeRemaining.isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700 font-pulse'
                    : b.status === 'CANCELLED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-600'

              const statusLabel =
                b.status === 'CONFIRMED'
                  ? 'Voyage confirmé'
                  : b.status === 'PENDING'
                    ? timeRemaining.isExpired ? 'Réservation expirée' : 'Paiement en attente'
                    : b.status === 'CANCELLED'
                      ? 'Réservation annulée'
                      : b.status

              const canPay = b.status === 'PENDING' && !timeRemaining.isExpired
              const canCancel = b.status === 'PENDING' && (!b.payment || b.payment.status !== 'PAID')

              return (
                <div key={b.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8">
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${b.status === 'CONFIRMED' ? 'bg-green-500' :
                    b.status === 'PENDING' ? (timeRemaining.isExpired ? 'bg-red-500' : 'bg-amber-400') :
                      b.status === 'CANCELLED' ? 'bg-red-400' : 'bg-gray-400'
                    }`} />

                  {/* Route & Times */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-gray-900">{b.trip.route.origin}</span>
                        <ArrowRight size={18} className="text-gray-300" />
                        <span className="text-xl font-black text-gray-900">{b.trip.route.destination}</span>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge}`}>
                        {statusLabel}
                      </span>

                      {b.status === 'PENDING' && !timeRemaining.isExpired && (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100">
                          <Clock size={14} />
                          Expire dans : {timeRemaining.formatted}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} className="text-primary-500" />
                        <span className="text-sm font-semibold">{format(new Date(b.trip.departureTime), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} className="text-primary-500" />
                        <span className="text-sm font-semibold">{format(new Date(b.trip.departureTime), 'HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bus size={18} className="text-primary-500" />
                        <span className="text-sm font-semibold">Siège {b.seat.seatNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CreditCard size={18} className="text-primary-500" />
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(b.totalPrice || b.trip.price, currency)}</span>
                      </div>
                    </div>

                    {/* Cancellation Reason or Expiration Note */}
                    {(b.status === 'CANCELLED' || (b.status === 'PENDING' && timeRemaining.isExpired)) && (
                      <div className="mt-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                        <p className="text-xs font-bold text-red-900 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-600" />
                          {b.status === 'CANCELLED'
                            ? (b as any).cancellationReason || "Votre réservation a été annulée."
                            : "Délai de paiement expiré. Cette réservation n'est plus valide."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 min-w-max">
                    {b.status === 'CONFIRMED' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <PrintInvoiceButton bookingId={b.id} />
                          <Link
                            href={`/bookings/${b.id}/confirmation`}
                            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 flex items-center gap-2"
                          >
                            <Ticket size={18} />
                            Voir billet
                          </Link>
                        </div>
                      </>
                    ) : canPay ? (
                      <Link
                        href={`/bookings/${b.id}/payment`}
                        className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl shadow-gray-200"
                      >
                        Payer maintenant
                      </Link>
                    ) : b.status === 'CANCELLED' || timeRemaining.isExpired ? (
                      <Link
                        href="/#search"
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Réserver à nouveau
                      </Link>
                    ) : null}

                    {canCancel && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CancelBookingButton bookingId={b.id} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

