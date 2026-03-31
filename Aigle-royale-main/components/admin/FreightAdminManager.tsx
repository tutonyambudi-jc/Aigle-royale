'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export function FreightAdminManager() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [q, setQ] = useState('')

    async function handleDeliver(id: string) {
        if (!confirm('Voulez-vous marquer ce colis comme livré ?')) return
        try {
            const res = await fetch(`/api/freight/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DELIVERED', notes: `Livraison validée par admin le ${new Date().toLocaleString()}` })
            })
            if (res.ok) {
                await fetchOrders()
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/freight')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement')
            setOrders(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter(o =>
        o.trackingCode.toLowerCase().includes(q.toLowerCase()) ||
        o.senderName.toLowerCase().includes(q.toLowerCase()) ||
        o.receiverName.toLowerCase().includes(q.toLowerCase())
    )

    const handleExportCSV = () => {
        const headers = ['Code', 'Expéditeur', 'Tel Exp', 'Destinataire', 'Tel Dest', 'Ville Dest', 'Poids', 'Valeur', 'Prix Payé', 'Statut', 'Date']
        const rows = filteredOrders.map(o => [
            o.trackingCode,
            o.senderName,
            o.senderPhone,
            o.receiverName,
            o.receiverPhone,
            o.destinationStop?.city.name || o.trip.route.destination,
            o.weight + 'kg',
            o.value || 0,
            o.price,
            o.status,
            format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm')
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `colis_admin_${format(new Date(), 'yyyyMMdd')}.csv`
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Rechercher un colis..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary-500 transition-all outline-none"
                        />
                        <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exporter vers Excel
                    </button>
                </div>

                {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-50">
                                <th className="pb-4 pt-2 font-bold text-gray-600">Colis</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Expéditeur</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Destinataire</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Ville</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Valeur</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Prix Payé</th>
                                <th className="pb-4 pt-2 font-bold text-gray-600">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">Chargement...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">Aucun colis trouvé</td>
                                </tr>
                            ) : filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4">
                                        <div className="font-bold text-primary-600">{o.trackingCode}</div>
                                        <div className="text-xs text-gray-500">{format(new Date(o.createdAt), 'dd MMMM yyyy')}</div>
                                    </td>
                                    <td className="py-4">
                                        <div className="font-semibold text-gray-900">{o.senderName}</div>
                                        <div className="text-sm text-gray-600">{o.senderPhone}</div>
                                    </td>
                                    <td className="py-4">
                                        <div className="font-semibold text-gray-900">{o.receiverName}</div>
                                        <div className="text-sm text-gray-600">{o.receiverPhone}</div>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-gray-900 font-medium">
                                            {o.destinationStop?.city.name || o.trip.route.destination}
                                        </div>
                                    </td>
                                    <td className="py-4 font-semibold text-gray-900">
                                        {o.value ? formatCurrency(o.value) : '-'}
                                    </td>
                                    <td className="py-4">
                                        <div className="font-bold text-gray-900">{formatCurrency(o.price)}</div>
                                        {o.payment?.status === 'PAID' ? (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded uppercase font-bold">Payé</span>
                                        ) : (
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded uppercase font-bold">Attente</span>
                                        )}
                                    </td>
                                    <td className="py-4 flex gap-2 items-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            o.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                                                o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    o.status === 'ISSUE' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {o.status === 'RECEIVED' ? 'Reçu' :
                                                o.status === 'EMBARKED' ? 'Embarqué' :
                                                    o.status === 'IN_TRANSIT' ? 'En transit' :
                                                        o.status === 'DELIVERED' ? 'Livré' :
                                                            o.status === 'ISSUE' ? 'Litige' : 'Annulé'}
                                        </span>
                                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                            <button
                                                onClick={() => handleDeliver(o.id)}
                                                className="p-1.5 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
                                                title="Marquer comme livré"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
