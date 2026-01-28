'use client'

import { getPaymentTimeRemaining, isPaymentUrgent } from '@/lib/booking-utils'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { AgentBookingForm } from '@/components/agent/AgentBookingForm'
import { FreightRegistrationForm } from '@/components/freight/FreightRegistrationForm'

import { ParcelManagement } from '@/components/freight/ParcelManagement'
import { ParcelLabel } from '@/components/freight/ParcelLabel'
import { CheckInModule } from '@/components/super-agent/CheckInModule'
import { PrintButton } from '@/components/PrintButton'
import { LogOut, User } from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface Booking {
  id: string
  ticketNumber: string
  passengerName: string
  passengerPhone: string | null
  passengerEmail?: string | null
  seat?: {
    id: string
    seatNumber: string
  } | null
  totalPrice?: number
  status: string
  createdAt: Date
  trip: {
    id: string
    departureTime: Date
    arrivalTime: Date
    price: number
    route: { origin: string; destination: string }
    bus: { name: string; plateNumber: string }
  }
  payment: { status: string; method: string; amount: number } | null
  user: { firstName: string; lastName: string; email: string } | null
}

interface SuperAgentStats {
  totalTicketSales: number
  todayTicketSales: number
  todayTicketRevenue: number
  totalFreightOrders: number
  todayFreightOrders: number
  todayFreightRevenue: number
}

interface FreightOrder {
  id: string
  trackingCode: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  weight: number
  type: string | null
  value: number | null
  price: number
  status: string
  notes: string | null
  createdAt: Date
  trip: {
    route: {
      origin: string
      destination: string
    }
    departureTime: Date
    bus?: {
      name: string
      plateNumber?: string
    }
  }
  payment?: {
    status: string
  } | null
}

import { useRouter, useSearchParams } from 'next/navigation'

// ... (other imports)

export function SuperAgentDashboard({
  initialStats,
  initialBookings,
  displayCurrency,
  agentInfo,
  weeklyStats,
}: {
  initialStats: SuperAgentStats
  initialBookings: Booking[]
  displayCurrency: 'FC' | 'USD'
  agentInfo?: { firstName: string; lastName: string; passportPhotoUrl: string | null }
  weeklyStats: { name: string; tickets: number; freight: number }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState(initialStats)

  const [activeTab, setActiveTab] = useState<'overview' | 'sell' | 'freight' | 'manage-parcels' | 'sales' | 'check-in'>('overview')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'sell', 'freight', 'manage-parcels', 'sales', 'check-in'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string>('')
  const [reportStats, setReportStats] = useState<{ count: number; revenue: number; paidCount: number; pendingCount: number } | null>(null)
  const [reportFreightStats, setReportFreightStats] = useState<{ count: number; revenue: number } | null>(null)
  const [reportBookings, setReportBookings] = useState<Booking[]>(initialBookings)

  const [freightOrders, setFreightOrders] = useState<any[]>([])
  const [loadingFreight, setLoadingFreight] = useState(false)

  const [lastFreightOrder, setLastFreightOrder] = useState<FreightOrder | null>(null)
  const [lastSoldTickets, setLastSoldTickets] = useState<Booking[] | null>(null)
  const [orderToPrint, setOrderToPrint] = useState<FreightOrder | null>(null)

  const filteredReportBookings = useMemo(() => {
    return reportBookings.filter((booking) => {
      if (filterStatus === 'ALL') return true
      return booking.status === filterStatus
    })
  }, [reportBookings, filterStatus])

  useEffect(() => {
    if (activeTab !== 'sales') return

      ; (async () => {
        setReportLoading(true)
        setReportError('')
        try {
          const res = await fetch(`/api/super-agent/reports?period=${reportPeriod}&date=${encodeURIComponent(reportDate)}`)
          const data = await res.json()
          if (!res.ok) {
            setReportError(data?.error || 'Une erreur est survenue')
            setReportBookings([])
            setReportStats(null)
            setReportFreightStats(null)
            return
          }
          setReportBookings(Array.isArray(data.bookings) ? data.bookings : [])
          setReportStats(data.stats || null)
          setReportFreightStats(data.freightStats || null)
        } catch (e: any) {
          setReportError(`Erreur rapport: ${e?.message || 'Erreur technique'}`)
          setReportBookings([])
          setReportStats(null)
          setReportFreightStats(null)
        } finally {
          setReportLoading(false)
        }
      })()
  }, [activeTab, reportPeriod, reportDate])

  const fetchFreightOrders = async () => {
    setLoadingFreight(true)
    try {
      const res = await fetch('/api/freight')
      const data = await res.json()
      setFreightOrders(data)
    } catch (err) {
      console.error('Error fetching freight:', err)
    } finally {
      setLoadingFreight(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'manage-parcels') {
      fetchFreightOrders()
    }
  }, [activeTab])

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/freight/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchFreightOrders()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Profil Super Agent en haut à droite */}
      {mounted && (
        <div className="fixed top-4 right-8 z-50 hidden lg:block">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-primary-100 hover:shadow-primary-200 transition-all">
            <div className="flex items-center gap-3">
              {agentInfo?.passportPhotoUrl ? (
                <img
                  src={agentInfo.passportPhotoUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-200 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border-2 border-primary-200 shadow-md">
                  <User className="w-7 h-7" />
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-gray-900 leading-none">
                  {agentInfo?.firstName} {agentInfo?.lastName}
                </div>
                <div className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mt-1">
                  Super Agent
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rapport de vente flottant */}
      <div className="fixed top-24 right-8 z-50 hidden lg:block">
        <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-primary-100 hover:shadow-primary-100 transition-all group">
          <div className="space-y-3">
            {/* Tickets */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tickets Aujourd'hui</div>
                <div className="text-base font-black text-gray-900 leading-none">{stats.todayTicketSales} vendu(s)</div>
                <div className="text-[11px] font-bold text-primary-600 mt-1">{formatCurrency(stats.todayTicketRevenue, displayCurrency)}</div>
              </div>
            </div>
            {/* Fret */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Fret Aujourd'hui</div>
                <div className="text-base font-black text-gray-900 leading-none">{stats.todayFreightOrders} colis</div>
                <div className="text-[11px] font-bold text-amber-600 mt-1">{formatCurrency(stats.todayFreightRevenue, displayCurrency)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => handleTabChange('sell')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'sell' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Créer un ticket
          </button>
          <button
            onClick={() => handleTabChange('freight')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'freight' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Envoyer un colis
          </button>
          <button
            onClick={() => handleTabChange('sales')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'sales' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Mes ventes
          </button>
          <button
            onClick={() => handleTabChange('manage-parcels')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'manage-parcels' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Gestion des Colis
          </button>
          <button
            onClick={() => handleTabChange('check-in')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'check-in' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Embarquement
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalTicketSales}</div>
            <div className="text-sm text-gray-600">Billets vendus (total)</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalFreightOrders}</div>
            <div className="text-sm text-gray-600">Colis enregistrés (total)</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.todayTicketRevenue, displayCurrency)}
            </div>
            <div className="text-sm text-gray-600">CA billets (aujourd’hui)</div>
            <div className="text-xs text-gray-500 mt-1">{stats.todayTicketSales} billet(s)</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.todayFreightRevenue, displayCurrency)}
            </div>
            <div className="text-sm text-gray-600">CA colis (aujourd’hui)</div>
            <div className="text-xs text-gray-500 mt-1">{stats.todayFreightOrders} colis</div>
          </div>
        </div>
      )}

      {/* Graphique de performance */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Performance de l'agence</h2>
              <p className="text-sm text-gray-500">Evolution du chiffre d'affaires combiné (Billets + Fret)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full" />
                <span className="text-xs font-bold text-gray-600">Billets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-xs font-bold text-gray-600">Fret</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyStats}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFreight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value, displayCurrency),
                      name === 'tickets' ? 'Billets' : 'Fret'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke="#d97706"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorTickets)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="freight"
                    stroke="#f59e0b"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorFreight)"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Chargement du graphique...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Réservations récentes */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Réservations récentes</h2>
              <p className="text-sm text-gray-500">Les 10 dernières réservations</p>
            </div>
            <button
              onClick={() => handleTabChange('sales')}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Voir tout →
            </button>
          </div>

          <div className="space-y-3">
            {reportBookings
              .filter((booking) => new Date(booking.trip.departureTime) > new Date()) // Only show future trips
              .slice(0, 10)
              .map((booking) => {
                const needsAttention = booking.payment?.status === 'PENDING' && booking.payment?.method !== 'CASH' && booking.payment?.method !== 'MOBILE_MONEY' && booking.payment?.method !== 'CARD'

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border-2 transition-all ${needsAttention
                      ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-gray-900">#{booking.ticketNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {booking.status === 'CONFIRMED' ? 'Confirmé' : booking.status === 'PENDING' ? 'En attente' : 'Annulé'}
                          </span>

                          {/* Payment Status Badge */}
                          {booking.payment && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${booking.payment.status === 'PAID'
                                ? 'bg-green-100 text-green-700'
                                : needsAttention
                                  ? 'bg-amber-100 text-amber-700 animate-pulse'
                                  : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                              {booking.payment.status === 'PAID' ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Payé
                                </>
                              ) : needsAttention ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  Validation requise
                                </>
                              ) : (
                                'En attente'
                              )}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-900 font-semibold mb-1">
                          {booking.passengerName}
                        </div>

                        <div className="text-xs text-gray-600">
                          {booking.trip.route.origin} → {booking.trip.route.destination} • {format(new Date(booking.trip.departureTime), 'dd/MM/yyyy à HH:mm')}
                        </div>

                        {booking.payment && (
                          <>
                            <div className="text-xs text-gray-500 mt-1">
                              Paiement: {
                                booking.payment.method === 'MOBILE_MONEY' ? 'Mobile Money ✓' :
                                  booking.payment.method === 'CARD' ? 'Carte bancaire ✓' :
                                    booking.payment.method === 'CASH' ? 'Espèces' :
                                      'En ligne (client)'
                              }
                            </div>

                            {/* Payment Deadline Countdown */}
                            {needsAttention && booking.payment.status === 'PENDING' && (() => {
                              const timeRemaining = getPaymentTimeRemaining({
                                id: booking.id,
                                createdAt: booking.createdAt,
                                status: booking.status,
                                trip: booking.trip,
                                payment: booking.payment
                              })
                              const isUrgent = isPaymentUrgent({
                                id: booking.id,
                                createdAt: booking.createdAt,
                                status: booking.status,
                                trip: booking.trip,
                                payment: booking.payment
                              })

                              return (
                                <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${timeRemaining.isExpired ? 'text-red-600' :
                                  isUrgent ? 'text-orange-600' :
                                    'text-amber-600'
                                  }`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {timeRemaining.isExpired ? 'Délai expiré - À annuler' : `Temps restant: ${timeRemaining.formatted}`}
                                </div>
                              )
                            })()}
                          </>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {formatCurrency(booking.totalPrice || booking.trip.price, displayCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(booking.createdAt), 'dd/MM à HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

            {reportBookings.filter((booking) => new Date(booking.trip.departureTime) > new Date()).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Aucune réservation récente pour des voyages à venir
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="space-y-6">
          {lastSoldTickets && lastSoldTickets.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm text-green-700 font-semibold">Vente effectuée</div>
                  <div className="text-2xl font-extrabold text-gray-900">
                    {lastSoldTickets.length} billet(s) •{' '}
                    {formatCurrency(
                      lastSoldTickets.reduce((s, b) => s + (b.totalPrice || b.trip.price), 0),
                      displayCurrency
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {lastSoldTickets[0].trip.route.origin} → {lastSoldTickets[0].trip.route.destination} • {format(new Date(lastSoldTickets[0].trip.departureTime), 'dd MMM yyyy à HH:mm')}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setLastSoldTickets(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Nouvelle vente
                  </button>
                  <button
                    onClick={() => handleTabChange('sales')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
                  >
                    Voir dans “Mes ventes”
                  </button>
                  <PrintButton
                    label="Imprimer"
                    className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold border border-green-200 hover:bg-green-100 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {lastSoldTickets.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-green-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        Billet <span className="font-mono">{b.ticketNumber}</span> • Siège: {b.seat?.seatNumber || '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Passager: {b.passengerName}
                        {b.passengerPhone ? ` • ${b.passengerPhone}` : ''}
                      </div>
                    </div>
                    <Link
                      href={`/bookings/${b.id}/confirmation`}
                      className="px-5 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                    >
                      Voir le billet
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Vente de billets en agence</h2>
              {lastSoldTickets && (
                <button
                  onClick={() => setLastSoldTickets(null)}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  Nouvelle vente
                </button>
              )}
            </div>
            <AgentBookingForm
              // l’API déduit automatiquement agencyStaffId depuis le rôle SUPER_AGENT
              agentId="super-agent"
              onSuccess={(bookingOrBookings) => {
                const arr = Array.isArray(bookingOrBookings) ? bookingOrBookings : [bookingOrBookings]
                const addedRevenue = arr.reduce((s, b) => s + (b.totalPrice || b.trip.price), 0)
                setStats(prev => ({
                  ...prev,
                  totalTicketSales: prev.totalTicketSales + arr.length,
                  todayTicketSales: prev.todayTicketSales + arr.length,
                  todayTicketRevenue: prev.todayTicketRevenue + addedRevenue,
                }))
                setLastSoldTickets(arr)
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'freight' && (
        <div className="space-y-6">
          {lastFreightOrder && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm text-green-700 font-semibold">Colis enregistré</div>
                  <div className="text-2xl font-extrabold text-gray-900">
                    Code de suivi: <span className="font-mono text-primary-700">{lastFreightOrder.trackingCode}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {lastFreightOrder.trip?.route?.origin} → {lastFreightOrder.trip?.route?.destination} • {lastFreightOrder.weight} kg • {formatCurrency(lastFreightOrder.price, displayCurrency)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/freight/${lastFreightOrder.id}`}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors text-center"
                  >
                    Voir / imprimer le reçu
                  </Link>
                  <Link
                    href={`/freight/track?code=${encodeURIComponent(lastFreightOrder.trackingCode)}`}
                    className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors text-center"
                  >
                    Suivre le colis
                  </Link>
                  <PrintButton
                    label="Imprimer"
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Expéditeur</div>
                  <div className="font-semibold text-gray-900">{lastFreightOrder.senderName}</div>
                  <div className="text-sm text-gray-600">{lastFreightOrder.senderPhone}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Destinataire</div>
                  <div className="font-semibold text-gray-900">{lastFreightOrder.receiverName}</div>
                  <div className="text-sm text-gray-600">{lastFreightOrder.receiverPhone}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Envoyer un colis</h2>
              {lastFreightOrder && (
                <button
                  onClick={() => setLastFreightOrder(null)}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  Nouveau colis
                </button>
              )}
            </div>

            <FreightRegistrationForm
              onSuccess={(order) => {
                setStats(prev => ({
                  ...prev,
                  totalFreightOrders: prev.totalFreightOrders + 1,
                  todayFreightOrders: prev.todayFreightOrders + 1,
                  todayFreightRevenue: prev.todayFreightRevenue + (order.price || 0),
                }))
                setLastFreightOrder(order)
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'manage-parcels' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          {loadingFreight ? (
            <div className="text-center py-12 text-gray-600">Chargement des colis...</div>
          ) : (
            <ParcelManagement
              orders={freightOrders}
              onStatusUpdate={handleStatusUpdate}
              onPrint={(order) => setOrderToPrint(order as any)}
            />
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-bold text-gray-900">Rapports</div>
              <div className="flex-1" />
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="day">Journalier</option>
                <option value="week">Hebdomadaire</option>
                <option value="month">Mensuel</option>
              </select>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {reportError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {reportError}
              </div>
            )}

            <div className="mt-4 grid md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Ventes</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportStats?.count ?? (reportLoading ? '...' : 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">CA billets</div>
                <div className="text-2xl font-extrabold text-gray-900">
                  {reportLoading ? '...' : formatCurrency(reportStats?.revenue || 0, displayCurrency)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Payées</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportStats?.paidCount ?? (reportLoading ? '...' : 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">En attente</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportStats?.pendingCount ?? (reportLoading ? '...' : 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                <div className="text-sm text-gray-600">Colis enregistrés</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportFreightStats?.count ?? (reportLoading ? '...' : 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                <div className="text-sm text-gray-600">CA colis</div>
                <div className="text-2xl font-extrabold text-gray-900">
                  {reportLoading ? '...' : formatCurrency(reportFreightStats?.revenue || 0, displayCurrency)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
              <div className="bg-primary-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-600">Total: </span>
                <span className="text-lg font-bold text-primary-600">{filteredReportBookings.length}</span>
              </div>
            </div>
          </div>

          {reportLoading ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">
              Chargement du rapport...
            </div>
          ) : filteredReportBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune vente trouvée</h3>
              <p className="text-gray-600">Aucune vente pour cette période.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReportBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Billet #{booking.ticketNumber}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {booking.status === 'CONFIRMED' ? 'Confirmé' : booking.status === 'PENDING' ? 'En attente' : 'Annulé'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Passager: {booking.passengerName}
                          {booking.passengerPhone && ` • ${booking.passengerPhone}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatCurrency(booking.totalPrice || booking.trip.price, displayCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">{format(new Date(booking.createdAt), 'dd MMM yyyy')}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Trajet</div>
                        <div className="font-semibold text-gray-900">{booking.trip.route.origin} → {booking.trip.route.destination}</div>
                        <div className="text-xs text-gray-500 mt-1">{format(new Date(booking.trip.departureTime), 'dd MMM yyyy à HH:mm')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Bus</div>
                        <div className="font-semibold text-gray-900">{booking.trip.bus.name}</div>
                        <div className="text-xs text-gray-500">{booking.trip.bus.plateNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Paiement</div>
                        <div className="font-semibold text-gray-900">{booking.payment?.status === 'PAID' ? '✅ Payé' : '⏳ En attente'}</div>
                        {booking.payment && (
                          <div className="text-xs text-gray-500">
                            {booking.payment.method === 'MOBILE_MONEY'
                              ? 'Mobile Money'
                              : booking.payment.method === 'CARD'
                                ? 'Carte bancaire'
                                : 'Espèces'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Link
                        href={`/bookings/${booking.id}/confirmation`}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Voir le billet
                      </Link>
                      <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Imprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'check-in' && (
        <CheckInModule />
      )}

      {/* Modal d'impression colis */}
      {orderToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Réimpression étiquette</h3>
              <button
                onClick={() => setOrderToPrint(null)}
                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ParcelLabel order={orderToPrint as any} />

            <p className="mt-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              Fermer cet aperçu après l'impression
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
