'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { signOut } from 'next-auth/react'
import {
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Ticket,
  Wallet,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  LogOut
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { AgentBookingForm } from './AgentBookingForm'
import { AgentSearchTrips } from './AgentSearchTrips'
import { AgencyDirectory } from './AgencyDirectory'
import {
  LineChart,
  Line,
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
  totalPrice?: number
  status: string
  createdAt: Date
  commission?: {
    amount: number
    percentage: number
    status: string
  } | null
  trip: {
    id: string
    departureTime: Date
    arrivalTime: Date
    price: number
    route: {
      origin: string
      destination: string
    }
    bus: {
      name: string
      plateNumber: string
    }
  }
  payment: {
    status: string
    method: string
    amount: number
  } | null
  user: {
    firstName: string
    lastName: string
    email: string
  } | null
}

interface AgentStats {
  totalSales: number
  totalCommission: number
  recentBookings: Booking[]
  todayBookings: number
  todayRevenue: number
  monthlyBookings: number
  monthlyRevenue: number
}

interface AgentDashboardProps {
  initialStats: AgentStats
  agentId: string
  agentName: string
  displayCurrency: 'FC' | 'USD'
}

export function AgentDashboard({ initialStats, agentId, agentName, displayCurrency }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sell' | 'bookings' | 'search'>('overview')
  const [stats, setStats] = useState(initialStats)
  const [lastSoldTickets, setLastSoldTickets] = useState<any[] | null>(null)
  const [mounted, setMounted] = useState(false)

  const recentBookings: Booking[] = (lastSoldTickets && lastSoldTickets.length) ? (lastSoldTickets as Booking[]) : stats.recentBookings

  useEffect(() => {
    setMounted(true)
  }, [])

  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [sellTripId, setSellTripId] = useState<string | undefined>(undefined)

  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string>('')
  const [reportStats, setReportStats] = useState<{ count: number; revenue: number; commissionTotal: number } | null>(null)
  const [reportBookings, setReportBookings] = useState<Booking[]>(initialStats.recentBookings)
  const [reportLimit, setReportLimit] = useState<number>(20)
  const [reportPage, setReportPage] = useState<number>(1)

  const filteredReportBookings = useMemo(() => {
    return reportBookings.filter((booking) => {
      if (filterStatus === 'ALL') return true
      return booking.status === filterStatus
    })
  }, [reportBookings, filterStatus])

  const paginatedBookings = useMemo(() => {
    const start = (reportPage - 1) * reportLimit
    return filteredReportBookings.slice(start, start + reportLimit)
  }, [filteredReportBookings, reportPage, reportLimit])

  const totalPages = Math.ceil(filteredReportBookings.length / reportLimit)

  useEffect(() => {
    if (activeTab !== 'bookings') return

      ; (async () => {
        setReportLoading(true)
        setReportError('')
        try {
          const res = await fetch(`/api/agent/reports?period=${reportPeriod}&date=${encodeURIComponent(reportDate)}`)
          const data = await res.json()
          if (!res.ok) {
            setReportError(data?.error || 'Une erreur est survenue')
            setReportBookings([])
            setReportStats(null)
            return
          }

          setReportBookings(Array.isArray(data.bookings) ? data.bookings : [])
          setReportStats(data.stats || null)
        } catch (e) {
          setReportError('Une erreur est survenue')
          setReportBookings([])
          setReportStats(null)
        } finally {
          setReportLoading(false)
        }
      })()
  }, [activeTab, reportPeriod, reportDate])

  const handleNewBooking = (created: Booking | Booking[]) => {
    const list = Array.isArray(created) ? created : [created]
    setLastSoldTickets([...list, ...(lastSoldTickets || [])])

    const totalAdded = list.reduce((sum, b) => sum + (b.totalPrice || b.trip.price), 0)
    setStats({
      ...stats,
      totalSales: stats.totalSales + list.length,
      todayBookings: stats.todayBookings + list.length,
      todayRevenue: stats.todayRevenue + totalAdded,
      monthlyBookings: stats.monthlyBookings + list.length,
      monthlyRevenue: stats.monthlyRevenue + totalAdded,
    })
    setActiveTab('overview')
    setSellTripId(undefined)
  }

  return (
    <div className="space-y-6 relative">
      {/* Rapport de vente flottant */}
      <div className="fixed top-24 right-8 z-50 hidden lg:block">
        <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-primary-100 hover:shadow-primary-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Ventes Aujourd'hui</div>
              <div className="text-base font-black text-gray-900 leading-none">{stats.todayBookings} billet(s)</div>
              <div className="text-[11px] font-bold text-primary-600 mt-1">{formatCurrency(stats.todayRevenue, displayCurrency)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'sell'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Vendre un billet
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'search'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Rechercher trajets
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'bookings'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Mes ventes
          </button>
        </div>

        <div className="flex items-center gap-4 px-4 border-l">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:block">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSales}</div>
              <div className="text-sm text-gray-600">Total ventes</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalCommission, displayCurrency)}</div>
              <div className="text-sm text-gray-600">Commission totale</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.todayBookings}</div>
              <div className="text-sm text-gray-600">Ventes aujourd'hui</div>
              <div className="text-xs text-gray-500 mt-1">{formatCurrency(stats.todayRevenue, displayCurrency)}</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.monthlyBookings}</div>
              <div className="text-sm text-gray-600">Ventes ce mois</div>
              <div className="text-xs text-gray-500 mt-1">{formatCurrency(stats.monthlyRevenue, displayCurrency)}</div>
            </div>
          </div>

          {/* Graphique de performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Performance des ventes</h2>
                <p className="text-sm text-gray-500">Evolution du chiffre d'affaires sur les 7 derniers jours</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  En direct
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: 'Lun', sales: 42000 },
                      { name: 'Mar', sales: 38000 },
                      { name: 'Mer', sales: 55000 },
                      { name: 'Jeu', sales: 48000 },
                      { name: 'Ven', sales: 72000 },
                      { name: 'Sam', sales: 91000 },
                      { name: 'Dim', sales: stats.todayRevenue },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
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
                      formatter={(value: number) => [formatCurrency(value, displayCurrency), 'Ventes']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#d97706"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorSales)"
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

          {/* Récentes ventes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ventes récentes</h2>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune vente récente
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">#{booking.ticketNumber}</div>
                      <div className="text-sm text-gray-600">
                        {booking.trip.route.origin} → {booking.trip.route.destination}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(booking.createdAt), 'dd MMM yyyy à HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600">{formatCurrency(booking.totalPrice ?? booking.trip.price, displayCurrency)}</div>
                      <div className="text-xs text-gray-500">
                        {booking.payment?.status === 'PAID' ? '✅ Payé' : '⏳ En attente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendre un billet */}
      {activeTab === 'sell' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendre un billet</h2>
          <AgentBookingForm
            agentId={agentId}
            preselectedTripId={sellTripId}
            onSuccess={handleNewBooking}
          />
        </div>
      )}

      {/* Rechercher trajets */}
      {activeTab === 'search' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rechercher des trajets disponibles</h2>
          <AgentSearchTrips agentId={agentId} onSelectTrip={(tripId) => {
            setSellTripId(tripId)
            setActiveTab('sell')
          }} />
        </div>
      )}

      {/* Mes ventes */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Rapport */}
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

            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Ventes ({reportPeriod === 'day' ? 'jour' : reportPeriod === 'week' ? 'semaine' : 'mois'})</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportStats?.count ?? (reportLoading ? '...' : 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Chiffre d’affaires</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportLoading ? '...' : formatCurrency(reportStats?.revenue || 0, displayCurrency)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Commissions</div>
                <div className="text-2xl font-extrabold text-gray-900">{reportLoading ? '...' : formatCurrency(reportStats?.commissionTotal || 0, displayCurrency)}</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
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
              <div className="bg-primary-50 rounded-lg px-4 py-2 flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher:</span>
                <select
                  value={reportLimit}
                  onChange={(e) => {
                    setReportLimit(Number(e.target.value))
                    setReportPage(1)
                  }}
                  className="bg-transparent text-primary-600 font-bold outline-none"
                >
                  {[20, 50, 60, 100].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <div className="w-px h-4 bg-primary-200" />
                <span className="text-sm text-gray-600">Total: </span>
                <span className="text-lg font-bold text-primary-600">{filteredReportBookings.length}</span>
              </div>
            </div>
          </div>

          {/* Liste des ventes */}
          {reportLoading ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">
              Chargement du rapport...
            </div>
          ) : filteredReportBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune vente trouvée</h3>
              <p className="text-gray-600">Commencez à vendre des billets pour voir vos ventes ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Billet #{booking.ticketNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {booking.status === 'CONFIRMED' ? 'Confirmé' :
                              booking.status === 'PENDING' ? 'En attente' : 'Annulé'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Passager: {booking.passengerName}
                          {booking.passengerPhone && ` • ${booking.passengerPhone}`}
                        </div>
                        {booking.user && (
                          <div className="text-xs text-gray-500 mt-1">
                            Client: {booking.user.firstName} {booking.user.lastName} ({booking.user.email})
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatCurrency(booking.totalPrice || booking.trip.price, displayCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(booking.createdAt), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Trajet</div>
                        <div className="font-semibold text-gray-900">
                          {booking.trip.route.origin} → {booking.trip.route.destination}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(booking.trip.departureTime), 'dd MMM yyyy à HH:mm')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Bus</div>
                        <div className="font-semibold text-gray-900">{booking.trip.bus.name}</div>
                        <div className="text-xs text-gray-500">{booking.trip.bus.plateNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Paiement</div>
                        <div className="font-semibold text-gray-900">
                          {booking.payment?.status === 'PAID' ? '✅ Payé' : '⏳ En attente'}
                        </div>
                        {booking.payment && (
                          <div className="text-xs text-gray-500">
                            {booking.payment.method === 'MOBILE_MONEY' ? 'Mobile Money' :
                              booking.payment.method === 'CARD' ? 'Carte bancaire' : 'Espèces'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Commission</div>
                        <div className="font-semibold text-gray-900">
                          {booking.commission ? formatCurrency(booking.commission.amount, displayCurrency) : '—'}
                        </div>
                        {booking.commission && (
                          <div className="text-xs text-gray-500">
                            {booking.commission.percentage}% • {booking.commission.status === 'PAID' ? 'Payée' : 'En attente'}
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
                        onClick={() => {
                          const printUrl = `/bookings/${booking.id}/confirmation?print=true`
                          window.open(printUrl, '_blank')
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Imprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <div className="text-sm text-gray-500 font-medium">
                    Page <span className="text-gray-900 font-bold">{reportPage}</span> sur <span className="text-gray-900 font-bold">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportPage(prev => Math.max(1, prev - 1))}
                      disabled={reportPage === 1}
                      className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all text-gray-700 text-sm"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setReportPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={reportPage === totalPages}
                      className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all text-gray-700 text-sm"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
