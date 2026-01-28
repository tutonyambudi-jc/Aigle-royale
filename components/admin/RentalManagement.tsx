'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Rental {
    id: string
    contactName: string
    contactPhone: string
    rentalType: string
    startDate: string
    endDate: string
    departureLocation: string
    destination: string
    passengerCount: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
    finalPrice: number | null
    basePrice: number | null
    adminNotes: string | null
    priceDetails: string | null
    busId: string | null
    driverId: string | null
    user: {
        firstName: string
        lastName: string
    }
}

export function RentalManagement() {
    const [rentals, setRentals] = useState<Rental[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
    const [buses, setBuses] = useState<any[]>([])
    const [drivers, setDrivers] = useState<any[]>([])
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchRentals()
        fetchBuses()
        fetchDrivers()
    }, [])

    const fetchRentals = async () => {
        try {
            const res = await fetch('/api/admin/rentals')
            if (res.ok) {
                const data = await res.json()
                setRentals(data)
            }
        } catch (err) {
            console.error('Fetch rentals error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchBuses = async () => {
        try {
            const res = await fetch('/api/admin/buses')
            if (res.ok) {
                const data = await res.json()
                setBuses(data)
            }
        } catch (err) {
            console.error('Fetch buses error:', err)
        }
    }

    const fetchDrivers = async () => {
        try {
            const res = await fetch('/api/admin/drivers') // Supposing there's a drivers API or use users with role DRIVER
            if (res.ok) {
                const data = await res.json()
                setDrivers(data)
            } else {
                // Fallback: fetch users with role AGENCY_STAFF or search for drivers
                const resUsers = await fetch('/api/admin/users?role=AGENCY_STAFF')
                if (resUsers.ok) {
                    const data = await resUsers.json()
                    setDrivers(data)
                }
            }
        } catch (err) {
            console.error('Fetch drivers error:', err)
        }
    }

    const handleUpdateRental = async (id: string, updates: any) => {
        try {
            const res = await fetch(`/api/admin/rentals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Mise à jour réussie' })
                fetchRentals()
                setSelectedRental(null)
            } else {
                const data = await res.json()
                setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Une erreur est survenue' })
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
            APPROVED: 'bg-green-100 text-green-700 border-green-200',
            REJECTED: 'bg-red-100 text-red-700 border-red-200',
            COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
            CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles] || styles.PENDING}`}>
                {status}
            </span>
        )
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des locations...</div>

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-4 font-bold">&times;</button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Demandes de Location</h3>
                    <div className="flex gap-2">
                        <span className="text-xs font-medium text-gray-500">{rentals.length} demandes au total</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Client / Contact</th>
                                <th className="px-6 py-4">Dates / Type</th>
                                <th className="px-6 py-4">Itinéraire</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Prix</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rentals.map((rental) => (
                                <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{rental.contactName}</div>
                                        <div className="text-[11px] text-gray-500">{rental.contactPhone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{format(new Date(rental.startDate), 'dd/MM/yyyy')}</div>
                                        <div className="text-[11px] text-primary-600 font-bold">{rental.rentalType === 'FULL_DAY' ? 'JOURNÉE' : 'DEMI-JOURNÉE'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-700 truncate max-w-[150px]">{rental.departureLocation} → {rental.destination}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(rental.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900">{rental.finalPrice || rental.basePrice || 0} FC</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedRental(rental)}
                                            className="text-primary-600 hover:text-primary-800 font-bold text-xs"
                                        >
                                            Gérer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rentals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        Aucune demande de location trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de gestion */}
            {selectedRental && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-900 text-white">
                            <h3 className="text-xl font-black">Gérer la Location</h3>
                            <button onClick={() => setSelectedRental(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                            {/* Infos Client */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</span>
                                    <p className="font-bold text-gray-900">{selectedRental.contactName}</p>
                                    <p className="text-sm text-gray-500">{selectedRental.contactPhone} / {selectedRental.user.firstName} {selectedRental.user.lastName}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type / Date</span>
                                    <p className="font-bold text-gray-900">{selectedRental.rentalType === 'FULL_DAY' ? 'Journée Complète' : 'Demi-journée'}</p>
                                    <p className="text-sm text-gray-500">{format(new Date(selectedRental.startDate), 'PPPP', { locale: fr })}</p>
                                </div>
                            </div>

                            {/* Itinéraire */}
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Itinéraire</span>
                                <p className="font-bold text-gray-900 text-lg">{selectedRental.departureLocation} <span className="text-primary-500">→</span> {selectedRental.destination}</p>
                            </div>

                            {/* Formulaire de validation */}
                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Attribuer un Car</label>
                                        <select
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm font-semibold"
                                            value={selectedRental.busId || ''}
                                            onChange={(e) => setSelectedRental({ ...selectedRental, busId: e.target.value })}
                                        >
                                            <option value="">Sélectionner un car</option>
                                            {buses.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} ({b.plateNumber}) - {b.seatType}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Prix Final (FC)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm font-semibold"
                                            value={selectedRental.finalPrice || selectedRental.basePrice || 0}
                                            onChange={(e) => setSelectedRental({ ...selectedRental, finalPrice: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Notes de l'Admin</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm font-semibold min-h-[80px]"
                                        placeholder="Notes internes..."
                                        value={selectedRental.adminNotes || ''}
                                        onChange={(e) => setSelectedRental({ ...selectedRental, adminNotes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => handleUpdateRental(selectedRental.id, {
                                            status: 'APPROVED',
                                            busId: selectedRental.busId,
                                            finalPrice: selectedRental.finalPrice || selectedRental.basePrice,
                                            adminNotes: selectedRental.adminNotes
                                        })}
                                        className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-200 hover:shadow-xl hover:bg-green-700 transition-all active:scale-95"
                                    >
                                        Valider la Demande
                                    </button>
                                    <button
                                        onClick={() => handleUpdateRental(selectedRental.id, {
                                            status: 'REJECTED',
                                            adminNotes: selectedRental.adminNotes
                                        })}
                                        className="flex-1 bg-red-50 text-red-600 border-2 border-red-100 py-4 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95"
                                    >
                                        Rejeter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
