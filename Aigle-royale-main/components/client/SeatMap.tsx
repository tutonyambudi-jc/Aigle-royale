'use client'

import React, { useMemo, useState, useEffect } from 'react'

interface Seat {
  id: string
  seatNumber: string
  seatType: string
  isAvailable: boolean
  [key: string]: any
}

interface SeatMapProps {
  seats?: Seat[]
  selectedSeat?: string
  selectedSeatIds?: string[]
  onSeatSelect?: (seatId: string | string[]) => void
  maxSelection?: number
  selectionKey?: 'id' | 'seatNumber'
}

function ArmchairIcon({ className = '', isVIP = false, isSelected = false }: { className?: string, isVIP?: boolean, isSelected?: boolean }) {
  const baseColor = isVIP ? '#FBBF24' : '#E5E7EB';
  const highlightColor = isVIP ? '#FDE68A' : '#FFFFFF';
  const shadowColor = isVIP ? '#B45309' : '#9CA3AF';

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="seatGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={highlightColor} />
            <stop offset="100%" stopColor={baseColor} />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Seat with 3D effect */}
        <g filter="url(#dropShadow)">
          {/* Backrest */}
          <rect x="10" y="10" width="44" height="30" rx="8" fill="url(#seatGradient)" />
          {/* Seat base */}
          <rect x="6" y="35" width="52" height="18" rx="8" fill={baseColor} />
          {/* Armrests */}
          <rect x="4" y="25" width="8" height="25" rx="4" fill={baseColor} />
          <rect x="52" y="25" width="8" height="25" rx="4" fill={baseColor} />
        </g>

        {isSelected && (
          <rect x="0" y="0" width="64" height="64" rx="10" fill="rgba(59, 130, 246, 0.3)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2" />
        )}
      </svg>
      {isVIP && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.6 5.3L20 9l-4 3.5L17.2 20 12 16.8 6.8 20 8 12.5 4 9l5.4-1.7L12 2z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default function SeatMap({ seats = [], selectedSeat, selectedSeatIds = [], onSeatSelect = () => {}, maxSelection = 1, selectionKey = 'id' }: SeatMapProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(() => {
    // Prioriser selectedSeatIds si disponible, sinon utiliser selectedSeat pour compatibilité
    if (selectedSeatIds && selectedSeatIds.length > 0) {
      return selectedSeatIds;
    }
    return selectedSeat ? [selectedSeat] : [];
  });

  // Synchroniser localSelected avec selectedSeatIds quand ils changent
  useEffect(() => {
    if (selectedSeatIds && selectedSeatIds.length > 0) {
      setLocalSelected(selectedSeatIds);
    } else if (selectedSeat) {
      setLocalSelected([selectedSeat]);
    } else {
      setLocalSelected([]);
    }
  }, [selectedSeatIds, selectedSeat]);

  const effectiveSelected = useMemo(() => {
    // Si maxSelection > 1, utiliser selectedSeatIds, sinon utiliser selectedSeat pour la compatibilité
    if (maxSelection > 1) {
      return localSelected;
    }
    return selectedSeat ? [selectedSeat] : localSelected;
  }, [selectedSeat, localSelected, maxSelection]);

  // group seats by row token (letters)
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

  function toggleSelect(seat: Seat) {
    const key = seat[selectionKey];
    const exists = effectiveSelected.includes(key);

    let next;
    if (exists) {
      next = effectiveSelected.filter(x => x !== key);
    } else {
      if (maxSelection === 1) {
        next = [key];
      } else {
        if (effectiveSelected.length < maxSelection) {
          next = [...effectiveSelected, key];
        } else {
          return; // Max selection reached
        }
      }
    }
    setLocalSelected(next);
    onSeatSelect(maxSelection === 1 ? (next[0] || '') : next);
  }

  function seatClasses(seat: Seat) {
    if (!seat.isAvailable) return 'bg-gray-300 border-gray-400 text-gray-600'
    if (seat.seatType === 'VIP') return 'bg-amber-400 border-amber-600 text-white'
    if (seat.seatType === 'OnSale') return 'bg-emerald-500 border-emerald-700 text-white'
    return 'bg-green-400 border-green-600 text-white'
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 w-full max-w-6xl mx-auto">
        {/* SeatMap à gauche */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Plan du Bus
            </h2>
            <p className="text-sm text-slate-600 mt-1">Cliquez sur un siège pour le sélectionner</p>
          </div>

          {/* Bus container (premium 3D look) */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 shadow-2xl border-2 border-slate-300 scale-75 origin-top-left">
            {/* Engine Section at the front */}
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-slate-200 to-slate-300 shadow-inner">
                <div className="text-center text-xs font-semibold text-slate-700">🔧 Partie Moteur</div>
                <div className="h-4 bg-slate-400 rounded-lg mt-2 shadow-sm"></div>
            </div>

            {/* Cockpit (driver left) */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-dashed border-slate-300">
              <div className="flex items-center gap-3">
                {/* Steering Wheel */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-slate-500 shadow-inner" />
                </div>
                {/* Driver's Seat Icon */}
                <div className="w-16 h-16 flex items-center justify-center">
                    <div className="w-12 h-12 text-slate-600">
                        <ArmchairIcon className="w-full h-full" />
                    </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-slate-500 font-medium">👨‍✈️ Conducteur</div>
                  <div className="text-sm font-bold text-slate-700">Poste de conduite</div>
                </div>
              </div>
            </div>

            {/* Engine / roof highlight for 3D depth */}
            <div className="absolute top-0 left-6 right-6 h-8 rounded-t-3xl bg-gradient-to-r from-white/80 to-slate-100/70 -translate-y-4 shadow-md border-t-2 border-slate-200" />

            {/* Seat grid */}
            <div className="mt-6 grid grid-cols-4 gap-2 p-2">
              {Object.keys(seatsByRow).map(row => (
                <div key={row} className="flex flex-col items-center">
                  <div className="text-xs font-bold text-slate-600 mb-2 bg-slate-200 px-2 py-1 rounded-full">R{row}</div>
                  {seatsByRow[row].map(seat => {
                    const isSelected = effectiveSelected.includes(seat[selectionKey]);
                    const base = seatClasses(seat)
                    return (
                      <button
                        key={seat.id}
                        onClick={() => seat.isAvailable && toggleSelect(seat)}
                        disabled={!seat.isAvailable}
                        className={`w-12 h-12 mb-1 flex items-center justify-center rounded-lg border-2 ${base} transition-all transform hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md ${isSelected ? 'ring-4 ring-blue-400 scale-110 animate-pulse shadow-xl' : ''} ${!seat.isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
                        title={`${seat.seatType} ${seat.seatNumber}`}
                      >
                        <div className="w-8 h-8">
                          <ArmchairIcon className="w-full h-full" isVIP={seat.seatType === 'VIP'} isSelected={isSelected} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Légende et info à droite */}
        <div className="flex-1 space-y-2.5 w-full lg:w-auto">
          {/* Selection info - Remonté en premier avec padding réduit */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-700 p-3 shadow-xl order-first">
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              <h3 className="text-sm font-bold text-white">Votre Sélection</h3>
            </div>
            <div className="text-lg font-bold text-white">
              {effectiveSelected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {effectiveSelected.map(seat => (
                    <span key={seat} className="inline-block bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm">
                      {seat}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-white/80 text-xs">Aucun siège sélectionné</span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-2xl bg-white border-2 border-slate-300 p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Légende des Sièges
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                <div className="w-10 h-10 bg-amber-400 rounded-xl border-2 border-amber-600 shadow-md flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2l2.6 5.3L20 9l-4 3.5L17.2 20 12 16.8 6.8 20 8 12.5 4 9l5.4-1.7L12 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Siège VIP</div>
                  <div className="text-xs text-slate-600">Confort premium ⭐</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                <div className="w-10 h-10 bg-green-400 rounded-xl border-2 border-green-600 shadow-md flex-shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Siège Disponible</div>
                  <div className="text-xs text-slate-600">Libre ✓</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl border-2 border-emerald-700 shadow-md flex-shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-slate-900">En Promotion</div>
                  <div className="text-xs text-slate-600">Prix réduit 🎉</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-300 rounded-xl border-2 border-gray-400 shadow-md flex-shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Occupé</div>
                  <div className="text-xs text-slate-600">Non disponible ✗</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="w-10 h-10 bg-blue-100 rounded-xl border-2 border-blue-400 ring-2 ring-blue-300 shadow-md flex-shrink-0"></div>
                <div>
                  <div className="text-sm font-bold text-blue-900">Sélectionné</div>
                  <div className="text-xs text-blue-700">Votre choix 👍</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
