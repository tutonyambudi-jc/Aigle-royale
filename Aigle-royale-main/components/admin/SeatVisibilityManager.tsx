'use client'

import { useState, useMemo } from 'react'

// SVG Icons as components
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.88 9.88m4.24 4.24L8.464 8.464m5.656 5.656l1.415 1.415" />
  </svg>
)

interface Seat {
  id: string
  seatNumber: string
  seatType: string
  isAvailable: boolean
  isHidden?: boolean
}

interface SeatVisibilityManagerProps {
  busId: string
  seats: Seat[]
}

export default function SeatVisibilityManager({ busId, seats }: SeatVisibilityManagerProps) {
  const [seatStates, setSeatStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    seats.forEach(seat => {
      initial[seat.id] = seat.isHidden || false
    })
    return initial
  })

  const [saving, setSaving] = useState<Set<string>>(new Set())

  // Grouper les sièges par rangée
  const seatsByRow = useMemo(() => {
    const rows: Record<string, Seat[]> = {}
    const sorted = [...seats].sort((a, b) => {
      const aMatch = a.seatNumber.match(/([A-Z]+)(\d+)/i) || ['','',a.seatNumber]
      const bMatch = b.seatNumber.match(/([A-Z]+)(\d+)/i) || ['','',b.seatNumber]
      if (aMatch[1] !== bMatch[1]) return aMatch[1].localeCompare(bMatch[1])
      return (parseInt(aMatch[2] || '0') || 0) - (parseInt(bMatch[2] || '0') || 0)
    })

    sorted.forEach(s => {
      const r = (s.seatNumber.match(/[A-Z]+/i) || [''])[0] || 'A'
      rows[r] = rows[r] || []
      rows[r].push(s)
    })

    return rows
  }, [seats])

  const toggleSeatVisibility = async (seatId: string) => {
    const newHiddenState = !seatStates[seatId]
    
    // Mettre à jour l'état local immédiatement pour un feedback instantané
    setSeatStates(prev => ({ ...prev, [seatId]: newHiddenState }))
    setSaving(prev => new Set(prev).add(seatId))

    try {
      const response = await fetch(`/api/admin/buses/${busId}/seats/${seatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: newHiddenState })
      })

      if (!response.ok) {
        // En cas d'erreur, revenir à l'état précédent
        setSeatStates(prev => ({ ...prev, [seatId]: !newHiddenState }))
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du siège')
    } finally {
      setSaving(prev => {
        const next = new Set(prev)
        next.delete(seatId)
        return next
      })
    }
  }

  const toggleRowVisibility = async (rowKey: string) => {
    const rowSeats = seatsByRow[rowKey]
    const allHidden = rowSeats.every(s => seatStates[s.id])
    const newState = !allHidden

    // Mettre à jour tous les sièges de la rangée
    const updates = rowSeats.map(seat => toggleSeatVisibility(seat.id))
    await Promise.all(updates)
  }

  const hiddenCount = Object.values(seatStates).filter(Boolean).length
  const visibleCount = seats.length - hiddenCount

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{seats.length}</div>
              <div className="text-sm text-blue-700">Sièges totaux</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <EyeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">{visibleCount}</div>
              <div className="text-sm text-green-700">Sièges visibles</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <EyeSlashIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{hiddenCount}</div>
              <div className="text-sm text-gray-700">Sièges cachés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Cliquez sur un siège pour le cacher ou le montrer</li>
              <li>• Les sièges cachés n'apparaîtront pas dans les réservations</li>
              <li>• Cliquez sur "Toute la rangée" pour cacher/montrer tous les sièges d'une rangée</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Plan des sièges */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Disposition des sièges
        </h2>

        {Object.entries(seatsByRow).map(([rowKey, rowSeats]) => {
          const allHidden = rowSeats.every(s => seatStates[s.id])
          const allVisible = rowSeats.every(s => !seatStates[s.id])
          
          return (
            <div key={rowKey} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                    {rowKey}
                  </span>
                  Rangée {rowKey}
                  <span className="text-sm font-normal text-gray-500">({rowSeats.length} sièges)</span>
                </h3>
                
                <button
                  onClick={() => toggleRowVisibility(rowKey)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                    allHidden
                      ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  {allHidden ? (
                    <>
                      <EyeIcon className="w-4 h-4" />
                      Afficher toute la rangée
                    </>
                  ) : (
                    <>
                      <EyeSlashIcon className="w-4 h-4" />
                      Cacher toute la rangée
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {rowSeats.map(seat => {
                  const isHidden = seatStates[seat.id]
                  const isSaving = saving.has(seat.id)
                  const isVIP = seat.seatType === 'VIP'

                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeatVisibility(seat.id)}
                      disabled={isSaving}
                      className={`
                        relative group aspect-square rounded-xl border-2 font-semibold text-sm
                        transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isHidden
                          ? 'bg-gray-200 border-gray-400 text-gray-600'
                          : isVIP
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-600 text-white shadow-md'
                            : 'bg-gradient-to-br from-green-400 to-green-500 border-green-600 text-white shadow-md'
                        }
                      `}
                      title={isHidden ? 'Siège caché - Cliquez pour afficher' : 'Siège visible - Cliquez pour cacher'}
                    >
                      {/* Numéro du siège */}
                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        <span className="font-bold">{seat.seatNumber}</span>
                        {isVIP && !isHidden && (
                          <span className="text-xs">⭐</span>
                        )}
                      </div>

                      {/* Icône de visibilité */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                        {isHidden ? (
                          <EyeIcon className="w-6 h-6 text-white" />
                        ) : (
                          <EyeSlashIcon className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Indicateur de sauvegarde */}
                      {isSaving && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-3">Légende</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              A1
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Siège VIP</div>
              <div className="text-gray-600">Visible</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 border-2 border-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              B1
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Siège Standard</div>
              <div className="text-gray-600">Visible</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 border-2 border-gray-400 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs">
              C1
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Siège Caché</div>
              <div className="text-gray-600">Non réservable</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <EyeSlashIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Survolez</div>
              <div className="text-gray-600">Pour cacher/afficher</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
