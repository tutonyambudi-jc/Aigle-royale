'use client'

import { useState, useEffect } from 'react'
import { format, differenceInYears } from 'date-fns'
import { Check, X, Search, UserCheck, Luggage, AlertCircle, Calendar } from 'lucide-react'
import { fr } from 'date-fns/locale'
import { VIPBoardingPass } from './VIPBoardingPass'
import { parseBookingQrScan } from '@/lib/booking-qr-payload'

interface Trip {
    id: string
    departureTime: string
    route: {
        origin: string
        destination: string
    }
    bus: {
        name: string
        plateNumber: string
        capacity: number
        seatType: string
    }
    _count: {
        bookings: number
    }
}

interface Passenger {
    id: string
    bookingGroupId?: string | null
    tripId: string
    ticketNumber: string
    passengerName: string
    passengerPhone: string | null
    status: string
    payment?: { status: string } | null
    checkedInAt: string | null
    seat: {
        seatNumber: string
    } | null
    user: {
        firstName: string
        lastName: string
        passportOrIdNumber: string | null
        birthDate: string | null
        phone?: string | null
    } | null
    qrCode: string | null
    baggageCount: number
    baggageWeight: number
    checkInNotes: string | null
}

export function CheckInModule() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [loadingTrips, setLoadingTrips] = useState(true)
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [selectedTripId, setSelectedTripId] = useState<string>('')
    const [forceTripId, setForceTripId] = useState<string | null>(null)

    const [passengers, setPassengers] = useState<Passenger[]>([])
    const [loadingPassengers, setLoadingPassengers] = useState(false)
    const [filterQuery, setFilterQuery] = useState('')

    // Modal State
    const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null)
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
    const [checkInForm, setCheckInForm] = useState({
        baggageCount: 0,
        baggageWeight: 0,
        checkInNotes: '',
        docsVerified: false,
    })
    const [submitting, setSubmitting] = useState(false)

    // Printing State
    const [passToPrint, setPassToPrint] = useState<any>(null)

    const handlePrintVIPPass = async (passenger: Passenger) => {
        const trip = trips.find(t => t.id === selectedTripId)
        if (!trip) return

        const paymentStatus =
            passenger.payment?.status ??
            (passenger.status === 'CONFIRMED' ? 'PAID' : 'PENDING')

        const passData = {
            bookingId: passenger.id,
            tripId: passenger.tripId,
            bookingGroupId: passenger.bookingGroupId ?? null,
            bookingStatus: passenger.status,
            paymentStatus,
            passengerName: passenger.passengerName,
            ticketNumber: passenger.ticketNumber,
            seatNumber: passenger.seat?.seatNumber || '—',
            departureTime: trip.departureTime,
            origin: trip.route.origin,
            destination: trip.route.destination,
            qrCode: passenger.qrCode,
            busName: trip.bus.name,
            plateNumber: trip.bus.plateNumber,
            baggageCount: passenger.baggageCount,
            baggageWeight: passenger.baggageWeight
        }

        setPassToPrint(passData)

        // Give a bit more time for the component and its internal QR effect to run
        setTimeout(() => {
            window.print()
            setPassToPrint(null)
        }, 1000)
    }

    useEffect(() => {
        fetchTrips(selectedDate)
    }, [selectedDate])

    useEffect(() => {
        if (selectedTripId) {
            fetchPassengers(selectedTripId)
        } else {
            setPassengers([])
        }
    }, [selectedTripId])

    const fetchTrips = async (dateStr: string) => {
        setLoadingTrips(true)
        try {
            const res = await fetch(`/api/super-agent/check-in/trips?date=${dateStr}`)
            if (!res.ok) return
            const data = await res.json()
            setTrips(data)

            // If we came from a global search, force the selection
            if (forceTripId) {
                setSelectedTripId(forceTripId)
                setForceTripId(null)
            }
        } catch (err) {
            console.error('Failed to fetch trips', err)
        } finally {
            setLoadingTrips(false)
        }
    }

    const fetchPassengers = async (tripId: string) => {
        setLoadingPassengers(true)
        try {
            const res = await fetch(`/api/super-agent/check-in/${tripId}/passengers`)
            if (!res.ok) return
            const data = await res.json()
            setPassengers(data)
        } catch (err) {
            console.error('Failed to fetch passengers', err)
        } finally {
            setLoadingPassengers(false)
        }
    }

    const openCheckInModal = (passenger: Passenger) => {
        setSelectedPassenger(passenger)
        setCheckInForm({
            baggageCount: passenger.baggageCount || 0,
            baggageWeight: passenger.baggageWeight || 0,
            checkInNotes: passenger.checkInNotes || '',
            docsVerified: !!passenger.checkedInAt, // Default to true if already checked in
        })
        setIsCheckInModalOpen(true)
    }

    const closeCheckInModal = () => {
        setIsCheckInModalOpen(false)
        setSelectedPassenger(null)
    }

    const handleConfirmCheckIn = async () => {
        if (!selectedPassenger) return
        setSubmitting(true)

        // If explicitly unchecking, we might want to reset verify, strictly following logic:
        // Here we assume "Confirm" means "Check In". 
        // If we want to un-check-in, we might need a separate button or toggle in modal.
        // For now, let's assume this modal is primarily for Checking IN.
        // If already checked in, this updates the info.

        const newStatus = true

        try {
            const res = await fetch('/api/super-agent/check-in/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: selectedPassenger.id,
                    checked: newStatus,
                    baggageCount: Number(checkInForm.baggageCount),
                    baggageWeight: Number(checkInForm.baggageWeight),
                    checkInNotes: checkInForm.checkInNotes
                })
            })

            if (res.ok) {
                // Optimistic update or refetch
                setPassengers(prev => prev.map(p =>
                    p.id === selectedPassenger.id ? {
                        ...p,
                        checkedInAt: new Date().toISOString(),
                        baggageCount: Number(checkInForm.baggageCount),
                        baggageWeight: Number(checkInForm.baggageWeight),
                        checkInNotes: checkInForm.checkInNotes
                    } : p
                ))

                // AUTO-PRINT for VIP
                const trip = trips.find(t => t.id === selectedTripId)
                if (trip?.bus.seatType === 'VIP') {
                    // Update the temporary passenger object for printing
                    const updatedPassenger = {
                        ...selectedPassenger,
                        baggageCount: Number(checkInForm.baggageCount),
                        baggageWeight: Number(checkInForm.baggageWeight),
                    }
                    handlePrintVIPPass(updatedPassenger)
                }

                closeCheckInModal()
            }
        } catch (err) {
            console.error('Error checking in:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUndoCheckIn = async (passengerId: string) => {
        if (!confirm("Voulez-vous vraiment annuler l'embarquement de ce passager ?")) return;

        try {
            const res = await fetch('/api/super-agent/check-in/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: passengerId,
                    checked: false
                })
            })

            if (res.ok) {
                setPassengers(prev => prev.map(p =>
                    p.id === passengerId ? { ...p, checkedInAt: null } : p
                ))
            }
        } catch (err) {
            console.error('Error undoing check in:', err)
        }
    }

    const filteredPassengers = passengers.filter(p => {
        const query = filterQuery.toLowerCase()
        return (
            p.passengerName.toLowerCase().includes(query) ||
            p.ticketNumber.toLowerCase().includes(query) ||
            (p.seat?.seatNumber || '').toLowerCase().includes(query) ||
            (p.qrCode || '').toLowerCase().includes(query) ||
            (p.passengerPhone || '').includes(query) ||
            (p.user?.firstName || '').toLowerCase().includes(query) ||
            (p.user?.lastName || '').toLowerCase().includes(query) ||
            (p.user?.passportOrIdNumber || '').toLowerCase().includes(query) ||
            (p.user?.phone || '').includes(query)
        )
    })

    const checkedInCount = passengers.filter(p => p.checkedInAt).length
    const totalBags = passengers.reduce((sum, p) => sum + (p.checkedInAt ? (p.baggageCount || 0) : 0), 0)
    const totalWeight = passengers.reduce((sum, p) => sum + (p.checkedInAt ? (p.baggageWeight || 0) : 0), 0)

    // Helper to calculate age
    const getAge = (dateString?: string | null) => {
        if (!dateString) return null
        return differenceInYears(new Date(), new Date(dateString))
    }

    const [globalSearching, setGlobalSearching] = useState(false)

    return (
        <div className="space-y-6">


            {/* BARRE DE RECHERCHE GLOBALE */}
            <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl shadow-lg p-6 text-white mb-6 animate-in slide-in-from-top duration-300">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Search className="w-6 h-6 text-primary-200" />
                            Recherche Globale
                        </h2>
                        <p className="text-primary-200 text-sm">Trouvez un passager sur n'importe quel départ du jour</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Scan QR, Nom, Ticket..."
                            disabled={globalSearching}
                            className={`w-full pl-4 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-primary-200 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium backdrop-blur-sm ${globalSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value
                                    if (val.length < 2) return
                                    setGlobalSearching(true)
                                    try {
                                        const res = await fetch(`/api/super-agent/check-in/search?query=${encodeURIComponent(val)}`)
                                        const data = await res.json()
                                        console.log('Global Search Result:', data)
                                        if (data && data.length > 0) {
                                            const match = data[0]
                                            console.log('Match Details:', match)
                                            const matchDate = match.departureTime ? format(new Date(match.departureTime), 'yyyy-MM-dd') : null
                                            console.log('Sync Logic - Match Date:', matchDate, 'Current Selected Date:', selectedDate)

                                            // 1. If date is different, we MUST load that date's trips first
                                            if (matchDate && matchDate !== selectedDate) {
                                                console.log('Date Redirect - Setting Force Trip ID:', match.tripId)
                                                setForceTripId(match.tripId)
                                                setSelectedDate(matchDate)
                                            } else {
                                                console.log('Same Date - Direct Selection of Trip ID:', match.tripId)
                                                setSelectedTripId(match.tripId)
                                            }

                                            setFilterQuery(val)
                                            e.currentTarget.value = ''
                                        } else {
                                            console.warn('Global Search yielded null or empty for:', val)
                                            alert('Aucun passager trouvé avec ce billet/nom.')
                                        }
                                    } catch (err) {
                                        console.error(err)
                                    } finally {
                                        setGlobalSearching(false)
                                    }
                                }
                            }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {globalSearching ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Search className="w-5 h-5 text-white/50" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <UserCheck className="w-8 h-8 text-primary-600" />
                    Embarquement & Check-in
                </h2>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Date du voyage
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value)
                                setSelectedTripId('') // Reset trip when date changes
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un voyage</label>
                        {loadingTrips ? (
                            <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                        ) : (
                            <select
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={selectedTripId}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                            >
                                <option value="">-- {trips.length > 0 ? 'Choisir un départ' : 'Aucun départ ce jour'} --</option>
                                {trips.map(trip => (
                                    <option key={trip.id} value={trip.id}>
                                        {format(new Date(trip.departureTime), 'HH:mm')} • {trip.route.origin} → {trip.route.destination} ({trip.bus.name})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedTripId && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                            <div className="text-center">
                                <div className="text-xs text-uppercase font-bold text-gray-500 tracking-wider">PASSAGERS</div>
                                <div className="text-xl font-black text-gray-900">{checkedInCount} <span className="text-gray-400 text-sm">/ {passengers.length}</span></div>
                            </div>
                            <div className="h-8 w-px bg-blue-200"></div>
                            <div className="text-center">
                                <div className="text-xs text-uppercase font-bold text-gray-500 tracking-wider">BAGAGES</div>
                                <div className="text-xl font-black text-blue-700">{totalBags} <span className="text-xs font-normal text-gray-500">pcs</span></div>
                            </div>
                            <div className="h-8 w-px bg-blue-200"></div>
                            <div className="text-center">
                                <div className="text-xs text-uppercase font-bold text-gray-500 tracking-wider">POIDS TOTAL</div>
                                <div className="text-xl font-black text-blue-700">{totalWeight} <span className="text-xs font-normal text-gray-500">kg</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {selectedTripId && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Nom, Téléphone, CNI, Billet, QR..."
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                                value={filterQuery}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setFilterQuery(val)
                                    // Exact match on QR or Ticket opens modal
                                    const parsed = parseBookingQrScan(val)
                                    const exactMatch = passengers.find((p) => {
                                        if (p.ticketNumber === val.trim()) return true
                                        if (parsed?.bookingId === p.id) return true
                                        if (parsed?.ticketNumber === p.ticketNumber) return true
                                        return false
                                    })
                                    if (exactMatch) {
                                        openCheckInModal(exactMatch)
                                        setFilterQuery('')
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 px-2 italic">
                            <span>Recherche étendue active (Client BD)</span>
                            <span>Scanner le QR Code ouvre automatiquement la fenêtre de validation.</span>
                        </div>

                        {loadingPassengers ? (
                            <div className="text-center py-12 text-gray-500">Chargement de la liste des passagers...</div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Siège</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Passager</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Infos</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredPassengers.map(passenger => {
                                            const age = getAge(passenger.user?.birthDate)
                                            return (
                                                <tr key={passenger.id} className={`hover:bg-gray-50 transition-colors ${passenger.checkedInAt ? 'bg-green-50/30' : ''}`}>
                                                    <td className="py-3 px-4">
                                                        <span className="font-mono font-bold text-lg text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                                            {passenger.seat?.seatNumber || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-gray-900">{passenger.passengerName}</div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                                            {passenger.passengerPhone}
                                                            {age !== null && (
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${age < 12 ? 'bg-blue-100 text-blue-700' :
                                                                    age > 60 ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {age} ans
                                                                </span>
                                                            )}
                                                        </div>
                                                        {passenger.checkInNotes && (
                                                            <div className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium bg-amber-50 inline-block px-1 rounded">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Note: {passenger.checkInNotes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-mono text-sm text-gray-600">#{passenger.ticketNumber}</div>
                                                        {passenger.checkedInAt && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    <Luggage className="w-3 h-3" />
                                                                    {passenger.baggageCount} • {passenger.baggageWeight}kg
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {passenger.checkedInAt ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => openCheckInModal(passenger)}
                                                                    className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-bold text-xs border border-green-200 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                    Modifier
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUndoCheckIn(passenger.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Annuler l'embarquement"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => openCheckInModal(passenger)}
                                                                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                Check-in
                                                            </button>
                                                        )}

                                                        {/* Manual Reprint for VIP */}
                                                        {passenger.checkedInAt && trips.find(t => t.id === selectedTripId)?.bus.seatType === 'VIP' && (
                                                            <button
                                                                onClick={() => handlePrintVIPPass(passenger)}
                                                                className="mt-2 text-[10px] font-bold text-amber-600 hover:text-amber-700 underline"
                                                            >
                                                                Réimprimer VIP
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {filteredPassengers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-500">
                                                    Aucun passager trouvé
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden VIP Pass for Printing - Hidden on screen, visible during print */}
            {passToPrint && (
                <div className="fixed opacity-0 pointer-events-none print:opacity-100 print:static print:pointer-events-auto">
                    <VIPBoardingPass passenger={passToPrint} />
                </div>
            )}

            {/* MODAL CHECK-IN */}
            {
                isCheckInModalOpen && selectedPassenger && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <UserCheck className="w-5 h-5" />
                                    Validation Check-in
                                </h3>
                                <button onClick={closeCheckInModal} className="text-white/80 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Identité */}
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">1. Identité du passager</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                                            {selectedPassenger.passengerName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-gray-900">{selectedPassenger.passengerName}</div>
                                            <div className="text-sm text-gray-600">ID: {selectedPassenger.user?.passportOrIdNumber || <span className="text-amber-600 italic">Non renseigné</span>}</div>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                            checked={checkInForm.docsVerified}
                                            onChange={(e) => setCheckInForm(prev => ({ ...prev, docsVerified: e.target.checked }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Documents d'identité vérifiés</span>
                                    </label>
                                </div>

                                {/* Bagages */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Luggage className="w-4 h-4" />
                                        2. Bagages
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de pièces</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center font-bold"
                                                value={checkInForm.baggageCount}
                                                onChange={(e) => setCheckInForm(prev => ({ ...prev, baggageCount: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Poids Total (kg)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center font-bold"
                                                value={checkInForm.baggageWeight}
                                                onChange={(e) => setCheckInForm(prev => ({ ...prev, baggageWeight: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes/Cas Spéciaux */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        3. Notes & Cas Spéciaux
                                    </h4>
                                    <textarea
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                        rows={3}
                                        placeholder="Femme enceinte, PMR, enfant non accompagné..."
                                        value={checkInForm.checkInNotes}
                                        onChange={(e) => setCheckInForm(prev => ({ ...prev, checkInNotes: e.target.value }))}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                                <button
                                    onClick={closeCheckInModal}
                                    className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmCheckIn}
                                    disabled={!checkInForm.docsVerified || submitting}
                                    className={`px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 ${(!checkInForm.docsVerified || submitting) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'
                                        }`}
                                >
                                    {submitting ? 'Enregistrement...' : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Confirmer l'embarquement
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div>
    )
}
