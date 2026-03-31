import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining } from '@/lib/booking-utils'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getLoyaltyProgress, tierLabel } from '@/lib/loyalty'
import { PrintInvoiceButton } from '@/components/reservations/PrintInvoiceButton'
import {
  Compass,
  Ticket,
  Gift,
  Share2,
  Package,
  ChevronRight,
  CalendarDays,
  Clock,
  Trophy,
  CreditCard,
  User,
  ArrowRight,
  Star,
  Bell,
  Sparkles,
} from 'lucide-react'

async function getUserBookings(userId: string) {
  return await prisma.booking.findMany({
    where: { userId },
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
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })
}

async function getUserFreightOrders(userId: string) {
  return await prisma.freightOrder.findMany({
    where: { userId },
    include: {
      trip: {
        include: {
          route: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })
}

async function getUserCompanyReviews(userId: string) {
  return await prisma.companyReview.findMany({
    where: { userId },
    select: {
      companyId: true,
      rating: true,
    },
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) {
    redirect('/auth/login')
  }

  const [bookings, freightOrders, me, companyReviews] = await Promise.all([
    getUserBookings(session.user.id),
    getUserFreightOrders(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true, loyaltyTier: true },
    }),
    getUserCompanyReviews(session.user.id),
  ])

  const loyaltyPoints = me?.loyaltyPoints || 0
  const loyaltyTier = me?.loyaltyTier || 'BRONZE'
  const progress = getLoyaltyProgress(loyaltyPoints)
  const pct = Math.round(progress.progress01 * 100)

  // Gradient definitions based on tier
  const tierGradients: Record<string, string> = {
    BRONZE: 'from-amber-700 to-amber-900',
    SILVER: 'from-slate-400 to-slate-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-cyan-400 to-blue-600',
    DIAMOND: 'from-purple-500 to-indigo-600'
  }

  const tierGradient = tierGradients[loyaltyTier] || tierGradients.BRONZE
  const reviewedCompanyIds = new Set(companyReviews.map((review) => review.companyId))

  return (
    <div className="space-y-10 font-sans">
      {/* Welcome + loyalty */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 md:p-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm md:grid md:grid-cols-[1fr_minmax(260px,340px)] md:gap-10 md:items-center">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tableau de bord</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Bonjour,{' '}
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              {session.user.name}
            </span>
          </h1>
          <p className="mt-2 text-slate-600 text-lg max-w-xl">
            Votre espace voyage : billets, fidélité et services en un coup d’œil.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/trips/search"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
            >
              <Compass size={18} />
              Nouveau trajet
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
            >
              <User size={18} />
              Mon profil
            </Link>
          </div>
        </div>

        <div
          className={`relative mt-8 md:mt-0 rounded-2xl p-6 text-white bg-gradient-to-br ${tierGradient} shadow-xl overflow-hidden group`}
        >
          <div className="absolute top-[5%] right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Trophy size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">Programme fidélité</p>
                <h2 className="text-2xl font-black mt-1">{tierLabel(loyaltyTier)}</h2>
              </div>
              <Sparkles className="bg-white/20 p-2 rounded-xl w-10 h-10 backdrop-blur-sm" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5 font-semibold opacity-90">
                <span>{loyaltyPoints} pts</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs opacity-85 leading-relaxed">
                {progress.nextTier && progress.pointsToNext !== null
                  ? `Encore ${progress.pointsToNext} pts pour ${tierLabel(progress.nextTier)}`
                  : 'Niveau maximum atteint.'}
              </p>
              <Link
                href="/loyalty"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white/95 hover:underline"
              >
                Voir les avantages <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          <Link
            href="/trips/search"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Compass size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-700">Réserver</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Rechercher un trajet</p>
          </Link>

          <Link
            href="/reservations"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Ticket size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700">Mes billets</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Historique</p>
          </Link>

          <Link
            href="/referral"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Share2 size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-700">Parrainage</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Inviter</p>
          </Link>

          <Link
            href="/loyalty"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Gift size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800">Récompenses</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Points</p>
          </Link>

          <Link
            href="/dashboard/reviews"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Star size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700">Mes avis</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Compagnies</p>
          </Link>

          <Link
            href="/dashboard/notifications"
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Bell size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700">Notifications</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Messages</p>
          </Link>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Bookings Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Réservations Récentes</h2>
                <p className="text-sm text-gray-500">Vos derniers voyages avec nous</p>
              </div>
              <Link href="/reservations" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1">
                Tout voir <ChevronRight size={16} />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Compass className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Aucun voyage pour le moment</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Explorez nos destinations et réservez votre premier voyage de luxe dès aujourd'hui.</p>
                <Link href="/trips/search" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg hover:shadow-primary-500/30">
                  Réserver un billet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                    {/* Status Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.status === 'CONFIRMED' ? 'bg-green-500' :
                      booking.status === 'PENDING' ? 'bg-amber-400' :
                        booking.status === 'CANCELLED' ? 'bg-red-400' : 'bg-gray-400'
                      }`} />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{booking.trip.route.origin}</span>
                            <ArrowRight size={16} className="text-gray-400" />
                            <span className="text-lg font-bold text-gray-900">{booking.trip.route.destination}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                            booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                              booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {booking.status === 'CONFIRMED' ? 'Confirmé' :
                              booking.status === 'PENDING' ? 'En attente' :
                                booking.status === 'CANCELLED' ? 'Annulé' : 'Terminé'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-gray-400" />
                            <span>{format(new Date(booking.trip.departureTime), 'dd MMMM yyyy', { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            <span>{format(new Date(booking.trip.departureTime), 'HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{formatCurrency(booking.trip.price, currency)}</span>
                          </div>
                        </div>

                        {/* Expiration Warning */}
                        {booking.status === 'PENDING' && booking.payment?.status === 'PENDING' && booking.payment?.method !== 'CASH' && (() => {
                          const { formatted, isExpired } = getPaymentTimeRemaining({
                            id: booking.id,
                            createdAt: booking.createdAt,
                            status: booking.status,
                            trip: booking.trip,
                            payment: booking.payment
                          })

                          if (isExpired) return (
                            <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                              ⚠️ Réservation expirée
                            </p>
                          )

                          return (
                            <p className="mt-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1 animate-pulse">
                              ⚠️ Paiement requis dans : <span className="font-bold">{formatted}</span> pour éviter l'annulation
                            </p>
                          )
                        })()}
                      </div>

                      <div className="flex items-center gap-3">
                        {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && booking.trip.bus.companyId && (
                          <Link
                            href={`/dashboard/reviews?companyId=${encodeURIComponent(booking.trip.bus.companyId)}`}
                            className="flex-1 sm:flex-none text-center px-4 py-2 border border-primary-200 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors"
                          >
                            {reviewedCompanyIds.has(booking.trip.bus.companyId) ? 'Modifier mon avis' : 'Noter la compagnie'}
                          </Link>
                        )}
                        {booking.status === 'CONFIRMED' ? (
                          <>
                            <div className="scale-0 group-hover:scale-100 transition-transform duration-300">
                              <PrintInvoiceButton bookingId={booking.id} />
                            </div>
                            <Link href={`/bookings/${booking.id}/confirmation`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors">
                              Voir le billet
                            </Link>
                          </>
                        ) : (
                          <Link href={`/bookings/${booking.id}/payment`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors shadow-lg hover:shadow-gray-500/20">
                            Payer maintenant
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Promo Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-primary-900 text-white p-8 shadow-lg">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Voyagez plus, Gagnez plus</h3>
                  <p className="text-indigo-100 mb-0 opacity-90 max-w-md">Invitez vos amis et recevez 500 points bonus pour chaque première réservation.</p>
                </div>
                <Link href="/referral" className="px-5 py-2.5 bg-white text-primary-900 font-bold rounded-lg shadow-xl hover:bg-indigo-50 transition-colors">
                  Inviter un ami
                </Link>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-10 -bottom-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
              <div className="absolute left-10 -top-20 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl"></div>
            </div>
          </div>

          {/* Sidebar Area: Freight & Support */}
          <div className="space-y-8">
            {/* Freight Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="text-primary-600" size={20} />
                  Colis & Fret
                </h3>
                <Link href="/freight/manage" className="text-xs font-semibold text-primary-600 hover:underline">
                  Gérer
                </Link>
              </div>

              {freightOrders.length > 0 ? (
                <div className="space-y-4">
                  {freightOrders.map((order) => (
                    <div key={order.id} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <Package size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900 truncate text-sm">{order.trackingCode}</p>
                          <span className={`w-2 h-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-500' :
                            order.status === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-gray-400'
                            }`} />
                        </div>
                        <p className="text-xs text-gray-500 truncate">{order.trip.route.origin} → {order.trip.route.destination}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-4">Besoin d'envoyer un colis ?</p>
                  <Link href="/freight" className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-xl transition-all">
                    Calculer un envoi
                  </Link>
                </div>
              )}
            </div>

            {/* Support / Help Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-gray-500 mb-4">Notre équipe est disponible 24/7 pour vous assister dans vos voyages.</p>
              <div className="space-y-2">
                <Link href="/contact" className="block text-center w-full py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  Centre d'aide
                </Link>
                <Link href="/faq" className="block text-center w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  Questions fréquentes
                </Link>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
