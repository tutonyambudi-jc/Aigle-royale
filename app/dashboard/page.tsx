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
  MapPin,
  CalendarDays,
  Clock,
  Trophy,
  CreditCard,
  User,
  ArrowRight,
  LogOut
} from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/LogoutButton'

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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) {
    redirect('/auth/login')
  }

  const [bookings, freightOrders, me] = await Promise.all([
    getUserBookings(session.user.id),
    getUserFreightOrders(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true, loyaltyTier: true },
    }),
  ])

  // Redirect based on role
  if (session.user.role === 'ADMINISTRATOR' || session.user.role === 'SUPERVISOR') {
    redirect('/admin')
  }
  if (session.user.role === 'AGENT') {
    redirect('/agent')
  }
  if (session.user.role === 'AGENCY_STAFF') {
    redirect('/agency')
  }
  if (session.user.role === 'SUPER_AGENT') {
    redirect('/super-agent')
  }
  if (session.user.role === 'LOGISTICS') {
    redirect('/logistics')
  }

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Hero Section with Welcome & Loyalty */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Bonjour, <span className="text-primary-600">{session.user.name}</span>
                </h1>
                <div className="lg:hidden">
                  <LogoutButton />
                </div>
              </div>
              <p className="text-gray-500 text-lg">Prêt pour votre prochain voyage avec Aigle Royale ?</p>
            </div>

            {/* Loyalty Card Small */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
              <div className="hidden lg:block">
                <LogoutButton />
              </div>

              <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${tierGradient} shadow-lg w-full md:w-auto md:min-w-[320px] relative overflow-hidden group transition-all hover:shadow-xl hover:scale-[1.02]`}>
                <div className="absolute top-[5%] right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-all duration-700">
                  <Trophy size={120} />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider opacity-90">Statut Fidélité</p>
                      <h3 className="text-2xl font-bold mt-1">{tierLabel(loyaltyTier)}</h3>
                    </div>
                    <User className="bg-white/20 p-1.5 rounded-full w-10 h-10 backdrop-blur-sm" />
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5 font-medium opacity-90">
                      <span>{loyaltyPoints} Points</span>
                      <span>{pct}% vers le prochain niveau</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <div className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs opacity-75">
                      {progress.nextTier && progress.pointsToNext !== null
                        ? `Encore ${progress.pointsToNext} pts pour ${tierLabel(progress.nextTier)}`
                        : 'Niveau maximum atteint !'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
          <Link href="/trips/search" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Compass size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">Réserver</h3>
            <p className="text-xs text-gray-500 mt-1">Trouver un trajet</p>
          </Link>

          <Link href="/reservations" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Ticket size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Mes billets</h3>
            <p className="text-xs text-gray-500 mt-1">Historique & actifs</p>
          </Link>

          <Link href="/referral" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Share2 size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">Parrainage</h3>
            <p className="text-xs text-gray-500 mt-1">Inviter & gagner</p>
          </Link>

          <Link href="/loyalty" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Gift size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-amber-700">Récompenses</h3>
            <p className="text-xs text-gray-500 mt-1">Utiliser mes points</p>
          </Link>

          <div className="hidden lg:block group bg-white/50 rounded-xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-400">Plus d'options bientôt</span>
          </div>
        </div>
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
                <Link href="/dashboard/freight" className="text-xs font-semibold text-primary-600 hover:underline">
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
    </div>
  )
}
