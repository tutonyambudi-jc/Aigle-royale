'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface Stop {
    id: string
    name: string
    city: { name: string }
}

interface FreightOrder {
    id: string
    trackingCode: string
    senderName: string
    senderPhone: string
    receiverName: string
    receiverPhone: string
    weight: number
    status: string
    createdAt: Date
    trip: {
        departureTime: Date
        route: { origin: string; destination: string }
        bus?: { name: string; plateNumber: string }
    }
    originStop?: Stop | null
    destinationStop?: Stop | null
    qrCode?: string | null
    type?: string | null
    value?: number | null
    price?: number
    notes?: string | null
}

interface ParcelManagementProps {
    orders: FreightOrder[]
    onStatusUpdate: (id: string, status: string) => Promise<void>
    onPrint?: (order: FreightOrder) => void
    title?: string
    showActions?: boolean
}

export function ParcelManagement({ orders, onStatusUpdate, onPrint, title = "Gestion des Colis", showActions = true }: ParcelManagementProps) {
    const [filter, setFilter] = useState('')
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const filteredOrders = orders.filter(o =>
        o.trackingCode.toLowerCase().includes(filter.toLowerCase()) ||
        o.senderName.toLowerCase().includes(filter.toLowerCase()) ||
        o.receiverName.toLowerCase().includes(filter.toLowerCase())
    )

    const handleUpdate = async (id: string, status: string) => {
        setLoadingId(id)
        try {
            await onStatusUpdate(id, status)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher (Code, Expéditeur, Destinataire)..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full md:w-80 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">
                    Aucun colis trouvé.
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrders.map((o) => (
                        <div key={o.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="font-mono text-lg font-bold text-primary-700">{o.trackingCode}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                                            o.status === 'EMBARKED' ? 'bg-yellow-100 text-yellow-800' :
                                                o.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800' :
                                                    o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {o.status === 'RECEIVED' ? 'Reçu en agence' :
                                                o.status === 'EMBARKED' ? 'Confirmé embarquement' :
                                                    o.status === 'IN_TRANSIT' ? 'En cours de route' :
                                                        o.status === 'DELIVERED' ? 'Livré' : o.status}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Expéditeur</div>
                                            <div className="font-semibold text-gray-900">{o.senderName}</div>
                                            <div className="text-sm text-gray-600">{o.senderPhone}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Destinataire</div>
                                            <div className="font-semibold text-gray-900">{o.receiverName}</div>
                                            <div className="text-sm text-gray-600">{o.receiverPhone}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Trajet</div>
                                            <div className="font-semibold text-gray-900">{o.trip.route.origin} → {o.trip.route.destination}</div>
                                            <div className="text-sm text-gray-600">
                                                Départ: {format(new Date(o.trip.departureTime), 'dd MMM yyyy HH:mm')}
                                            </div>
                                        </div>
                                    </div>

                                    {(o.originStop || o.destinationStop) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4">
                                            {o.originStop && (
                                                <div>
                                                    <div className="text-xs text-gray-500 font-bold">Point de dépôt spécifique</div>
                                                    <div className="text-sm text-gray-800">{o.originStop.city.name} - {o.originStop.name}</div>
                                                </div>
                                            )}
                                            {o.destinationStop && (
                                                <div>
                                                    <div className="text-xs text-gray-500 font-bold">Point de retrait spécifique</div>
                                                    <div className="text-sm text-gray-800">{o.destinationStop.city.name} - {o.destinationStop.name}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center min-w-[200px]">
                                    {o.qrCode && (
                                        <div className="flex justify-center">
                                            <img src={o.qrCode} alt="QR Code" className="w-24 h-24 border border-gray-200 rounded" />
                                        </div>
                                    )}
                                    {showActions && (
                                        <div className="space-y-2">
                                            {o.status === 'RECEIVED' && (
                                                <button
                                                    onClick={() => handleUpdate(o.id, 'EMBARKED')}
                                                    disabled={!!loadingId}
                                                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
                                                >
                                                    {loadingId === o.id ? '...' : 'Confirmer Embarquement'}
                                                </button>
                                            )}
                                            {o.status === 'EMBARKED' && (
                                                <button
                                                    onClick={() => handleUpdate(o.id, 'IN_TRANSIT')}
                                                    disabled={!!loadingId}
                                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    {loadingId === o.id ? '...' : 'Marquer En Route'}
                                                </button>
                                            )}
                                            {(o.status === 'IN_TRANSIT' || o.status === 'EMBARKED') && (
                                                <button
                                                    onClick={() => handleUpdate(o.id, 'DELIVERED')}
                                                    disabled={!!loadingId}
                                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {loadingId === o.id ? '...' : 'Confirmer Livraison'}
                                                </button>
                                            )}
                                            {onPrint && (
                                                <button
                                                    onClick={() => onPrint(o)}
                                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    Imprimer
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
