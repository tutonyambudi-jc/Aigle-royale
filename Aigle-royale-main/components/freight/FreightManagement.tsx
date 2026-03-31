'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { FreightRegistrationForm } from './FreightRegistrationForm'
import { FreightTracking } from './FreightTracking'
import { ParcelLabel } from './ParcelLabel'

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
    bus: {
      name: string
      plateNumber: string
    }
  }
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
  payment: {
    status: string
  } | null
}

interface FreightManagementProps {
  initialOrders: FreightOrder[]
  userRole: string
}

export function FreightManagement({ initialOrders, userRole }: FreightManagementProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'register' | 'track' | 'analytics'>('list')
  const [orders, setOrders] = useState(initialOrders)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'price'>('date')
  const [orderToPrint, setOrderToPrint] = useState<FreightOrder | null>(null)

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus
    const matchesSearch = searchTerm === '' ||
      order.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trip.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trip.route.destination.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      case 'price':
        return b.price - a.price
      default:
        return 0
    }
  })

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/freight/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Reçu'
      case 'IN_TRANSIT':
        return 'En transit'
      case 'DELIVERED':
        return 'Livré'
      case 'CANCELLED':
        return 'Annulé'
      default:
        return status
    }
  }

  const canManage = ['ADMINISTRATOR', 'AGENT', 'SUPER_AGENT', 'AGENCY_STAFF', 'SUPERVISOR'].includes(userRole)

  // Calcul des statistiques pour l'analytique
  const analytics = {
    total: orders.length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    inTransit: orders.filter(o => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    totalRevenue: orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.price, 0),
    averageWeight: orders.length > 0 ? orders.reduce((sum, o) => sum + o.weight, 0) / orders.length : 0,
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'list'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Liste des colis
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'register'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Enregistrer un colis
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'track'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Suivre un colis
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'analytics'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Statistiques
        </button>
      </div>

      {/* Liste des colis */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Code, nom, ville..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="RECEIVED">Reçu</option>
                  <option value="IN_TRANSIT">En transit</option>
                  <option value="DELIVERED">Livré</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'price')}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="date">Date</option>
                  <option value="status">Statut</option>
                  <option value="price">Prix</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="bg-primary-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-600">Résultats: </span>
                <span className="text-lg font-bold text-primary-600">{filteredOrders.length}</span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('ALL')
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Liste */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun colis trouvé</h3>
              <p className="text-gray-600">Aucun colis ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Code: {order.trackingCode}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Créé le {format(new Date(order.createdAt), 'dd MMMM yyyy à HH:mm')}
                        </p>
                        {order.user && (
                          <p className="text-sm text-gray-600 mt-1">
                            Client: {order.user.firstName} {order.user.lastName} ({order.user.email})
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-semibold"
                        >
                          <option value="RECEIVED">Reçu</option>
                          <option value="IN_TRANSIT">En transit</option>
                          <option value="DELIVERED">Livré</option>
                          <option value="CANCELLED">Annulé</option>
                        </select>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Expéditeur</div>
                        <div className="font-semibold text-gray-900">{order.senderName}</div>
                        <div className="text-sm text-gray-600">{order.senderPhone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Destinataire</div>
                        <div className="font-semibold text-gray-900">{order.receiverName}</div>
                        <div className="text-sm text-gray-600">{order.receiverPhone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Trajet</div>
                        <div className="font-semibold text-gray-900">
                          {order.trip.route.origin} → {order.trip.route.destination}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(order.trip.departureTime), 'dd MMM yyyy à HH:mm')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Bus: {order.trip.bus.name} ({order.trip.bus.plateNumber})
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Détails</div>
                        <div className="font-semibold text-gray-900">{order.weight} kg</div>
                        {order.type && (
                          <div className="text-sm text-gray-600">Type: {order.type}</div>
                        )}
                        {order.value && (
                          <div className="text-sm text-gray-600">Valeur: {formatCurrency(order.value)}</div>
                        )}
                      </div>
                    </div>

                    {/* Footer avec prix et actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Montant</div>
                        <div className="text-2xl font-bold text-primary-600">{formatCurrency(order.price)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Paiement: {order.payment?.status === 'PAID' ? '✅ Payé' : '⏳ En attente'}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/freight/${order.id}`}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Voir détails
                        </Link>
                        <Link
                          href={`/freight/track?code=${order.trackingCode}`}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                        >
                          Suivre
                        </Link>
                        {canManage && (
                          <button
                            onClick={() => setOrderToPrint(order)}
                            className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimer l'étiquette
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enregistrement */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enregistrer un nouveau colis</h2>
          <FreightRegistrationForm
            onSuccess={(newOrder) => {
              setOrders([newOrder, ...orders])
              setActiveTab('list')
            }}
          />
        </div>
      )}

      {/* Suivi */}
      {activeTab === 'track' && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Suivre un colis</h2>
          <FreightTracking />
        </div>
      )}

      {/* Statistiques */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistiques et Analyses</h2>

            {/* Graphiques de répartition */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border-2 border-primary-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par statut</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Reçu</span>
                      <span className="text-sm font-semibold">{analytics.received} ({analytics.total > 0 ? Math.round((analytics.received / analytics.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analytics.total > 0 ? (analytics.received / analytics.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">En transit</span>
                      <span className="text-sm font-semibold">{analytics.inTransit} ({analytics.total > 0 ? Math.round((analytics.inTransit / analytics.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${analytics.total > 0 ? (analytics.inTransit / analytics.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Livré</span>
                      <span className="text-sm font-semibold">{analytics.delivered} ({analytics.total > 0 ? Math.round((analytics.delivered / analytics.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${analytics.total > 0 ? (analytics.delivered / analytics.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Annulé</span>
                      <span className="text-sm font-semibold">{analytics.cancelled} ({analytics.total > 0 ? Math.round((analytics.cancelled / analytics.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${analytics.total > 0 ? (analytics.cancelled / analytics.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs clés</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Revenus totaux</span>
                    <span className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Poids moyen</span>
                    <span className="text-2xl font-bold text-purple-600">{analytics.averageWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Taux de livraison</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {analytics.total > 0 ? Math.round((analytics.delivered / analytics.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau récapitulatif */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pourcentage</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Reçu</td>
                    <td className="py-3 px-4 font-semibold">{analytics.received}</td>
                    <td className="py-3 px-4">{analytics.total > 0 ? Math.round((analytics.received / analytics.total) * 100) : 0}%</td>
                    <td className="py-3 px-4">{formatCurrency(orders.filter(o => o.status === 'RECEIVED').reduce((sum, o) => sum + o.price, 0))}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">En transit</td>
                    <td className="py-3 px-4 font-semibold">{analytics.inTransit}</td>
                    <td className="py-3 px-4">{analytics.total > 0 ? Math.round((analytics.inTransit / analytics.total) * 100) : 0}%</td>
                    <td className="py-3 px-4">{formatCurrency(orders.filter(o => o.status === 'IN_TRANSIT').reduce((sum, o) => sum + o.price, 0))}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Livré</td>
                    <td className="py-3 px-4 font-semibold">{analytics.delivered}</td>
                    <td className="py-3 px-4">{analytics.total > 0 ? Math.round((analytics.delivered / analytics.total) * 100) : 0}%</td>
                    <td className="py-3 px-4">{formatCurrency(orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.price, 0))}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Annulé</td>
                    <td className="py-3 px-4 font-semibold">{analytics.cancelled}</td>
                    <td className="py-3 px-4">{analytics.total > 0 ? Math.round((analytics.cancelled / analytics.total) * 100) : 0}%</td>
                    <td className="py-3 px-4">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Modal d'impression */}
      {orderToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Aperçu de l'étiquette</h3>
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
