'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type BusItem = {
  id: string
  name: string
  plateNumber: string
  capacity: number
  seatLayout: string | null
  seatType: string
  seats?: Array<{
    id: string
    seatNumber: string
    isAvailable: boolean
  }>
}

function safeParseSeatLayout(seatLayout: string | null | undefined): { rows: number; seatsPerRow: number } {
  try {
    if (!seatLayout) {
      return { rows: 10, seatsPerRow: 5 }
    }
    const parsed = JSON.parse(seatLayout)
    return {
      rows: typeof parsed?.rows === 'number' && parsed.rows > 0 ? parsed.rows : 10,
      seatsPerRow: typeof parsed?.seatsPerRow === 'number' && parsed.seatsPerRow > 0 ? parsed.seatsPerRow : 5,
    }
  } catch {
    return { rows: 10, seatsPerRow: 5 }
  }
}

export function BusSeatConfigurator({ buses = [] }: { buses: BusItem[] }) {
  const router = useRouter()

  const [selectedBusId, setSelectedBusId] = useState<string>('')
  const [seats, setSeats] = useState<Array<{ id: string; seatNumber: string; isAvailable: boolean }>>([])

  useEffect(() => {
    if (buses.length > 0 && !selectedBusId) {
      setSelectedBusId(buses[0].id)
    }
  }, [buses, selectedBusId])

  const selectedBus = useMemo(
    () => buses.find((b) => b.id === selectedBusId),
    [buses, selectedBusId]
  )

  const [rows, setRows] = useState<number>(10)
  const [seatsPerRow, setSeatsPerRow] = useState<number>(5)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Charger les sièges existants quand le bus change
  useEffect(() => {
    if (selectedBus) {
      const d = safeParseSeatLayout(selectedBus.seatLayout)
      setRows(d.rows)
      setSeatsPerRow(d.seatsPerRow)
      setMessage(null)

      // Charger les sièges existants
      if (selectedBus.seats) {
        setSeats(selectedBus.seats)
      } else {
        setSeats([])
      }
    }
  }, [selectedBus])

  const passengerCapacity = useMemo(() => Math.max(0, rows) * Math.max(0, seatsPerRow), [rows, seatsPerRow])

  const toggleSeatAvailability = async (seatId: string) => {
    if (!selectedBusId) return

    const seat = seats.find(s => s.id === seatId)
    if (!seat) return

    try {
      const res = await fetch(`/api/admin/buses/${selectedBusId}/seats/${seatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !seat.isAvailable }),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data?.error || 'Erreur lors de la mise à jour' })
        return
      }

      // Mettre à jour localement
      setSeats(prev => prev.map(s =>
        s.id === seatId ? { ...s, isAvailable: !s.isAvailable } : s
      ))

      setMessage({
        type: 'success',
        text: `Siège ${seat.seatNumber} ${!seat.isAvailable ? 'activé' : 'désactivé'}`
      })

      // Rafraîchir après un court délai
      setTimeout(() => router.refresh(), 500)
    } catch (err) {
      setMessage({ type: 'error', text: 'Une erreur est survenue' })
    }
  }

  const submit = async () => {
    if (!selectedBusId) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/buses/${selectedBusId}/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, seatsPerRow }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'Impossible de configurer les sièges' })
        setLoading(false)
        return
      }

      setMessage({
        type: 'success',
        text: `Configuration appliquée: ${data.passengerCapacity} sièges passagers générés.`,
      })

      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Une erreur est survenue: ' + (err.message || 'Erreur inconnue') })
    } finally {
      setLoading(false)
    }
  }

  if (!buses || buses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration des sièges (bus)</h2>
        <p className="text-gray-600">Aucun bus disponible pour la configuration. Veuillez d'abord ajouter un bus.</p>
      </div>
    )
  }

  const layout = safeParseSeatLayout(selectedBus?.seatLayout)
  const seatMap = new Map(seats.map(s => [s.seatNumber, s]))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuration des sièges (bus)</h2>
          <p className="text-gray-600 text-sm">
            Attribue un numéro à chaque siège passager (A1, A2...) et exclut le siège chauffeur (sans numéro).
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus à configurer</label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {!selectedBusId && <option value="">Choisir un bus...</option>}
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.plateNumber})
                  </option>
                ))}
              </select>
              {selectedBus && (
                <p className="mt-2 text-xs text-gray-500">
                  Type: {selectedBus.seatType} • Capacité actuelle: {selectedBus.capacity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Info Chauffeur</label>
              <div className="px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                Siège présent (non numéroté)
              </div>
              <p className="mt-2 text-xs text-gray-500">Réservé chauffeur, hors vente.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de rangées</label>
              <input
                type="number"
                min={1}
                max={26}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Places par rangée</label>
              <input
                type="number"
                min={1}
                max={15}
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
            <div className="text-sm text-gray-700">
              Future capacité: <span className="font-bold">{passengerCapacity}</span> places
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={loading || !selectedBusId}
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Générer la configuration'}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">Plan des sièges</div>
            <div className="text-xs text-gray-500">
              {layout.rows} x {layout.seatsPerRow}
            </div>
          </div>

          {seats.length > 0 ? (
            <>
              <div className="mb-3 flex gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Actif</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Désactivé</span>
                </div>
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${layout.seatsPerRow}, minmax(0, 1fr))` }}>
                {Array.from({ length: layout.rows }, (_, r) => {
                  const rowLetter = String.fromCharCode(65 + r)
                  return Array.from({ length: layout.seatsPerRow }, (_, s) => {
                    const seatNumber = `${rowLetter}${s + 1}`
                    const seat = seatMap.get(seatNumber)

                    if (!seat) return null

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeatAvailability(seat.id)}
                        className={`h-8 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-all hover:scale-105 ${seat.isAvailable
                            ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                            : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                          }`}
                        title={`Cliquez pour ${seat.isAvailable ? 'désactiver' : 'activer'} le siège ${seatNumber}`}
                      >
                        {seatNumber}
                      </button>
                    )
                  })
                })}
              </div>
              <div className="mt-4 text-xs text-center text-gray-500">
                Cliquez sur un siège pour le désactiver/activer
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Générez d'abord la configuration pour voir les sièges
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

