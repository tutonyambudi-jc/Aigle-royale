'use client'

interface Seat {
  id: string
  seatNumber: string
  seatType: string
  isAvailable: boolean
}

interface SeatMapProps {
  seats: Seat[]
  selectedSeat?: string | null // For single selection (backward compatibility)
  selectedSeatIds?: string[]   // For multiple selection
  onSeatSelect: (seatId: string) => void
  maxSelection?: number
}

export function SeatMap({
  seats,
  selectedSeat,
  selectedSeatIds = [],
  onSeatSelect,
  maxSelection = 1
}: SeatMapProps) {
  // Merge single and multiple selection for logic
  const effectiveSelectedIds = selectedSeat ? [selectedSeat] : selectedSeatIds;

  // Organiser les sièges par rangée (A, B, C, etc.)
  const seatsByRow: Record<string, Seat[]> = {}

  seats.forEach((seat) => {
    // Si pas de lettre (ex: "1", "2"), on utilise "Standard" comme clé
    const row = /^[A-Z]/.test(seat.seatNumber) ? seat.seatNumber.charAt(0) : 'Row'
    if (!seatsByRow[row]) {
      seatsByRow[row] = []
    }
    seatsByRow[row].push(seat)
  })

  // Trier les sièges par numéro dans chaque rangée
  Object.keys(seatsByRow).forEach((row) => {
    seatsByRow[row].sort((a, b) => {
      const numA = parseInt(a.seatNumber.replace(/\D/g, '')) || 0
      const numB = parseInt(b.seatNumber.replace(/\D/g, '')) || 0
      return numA - numB
    })
  })

  const getSeatColor = (seat: Seat) => {
    if (!seat.isAvailable) return 'bg-slate-200 text-slate-400 cursor-not-allowed border-transparent opacity-40 shadow-none'
    if (effectiveSelectedIds.includes(seat.id)) return 'bg-primary-600 text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] ring-4 ring-primary-100 scale-105 z-10 border-primary-700'
    if (seat.seatType === 'VIP') return 'bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 border-amber-300 shadow-md'
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-primary-300 shadow-sm'
  }

  return (
    <div className="space-y-6">
      {/* Realistic Bus Frame */}
      <div className="relative max-w-[320px] mx-auto group">
        <div className="absolute inset-0 bg-slate-900/5 rounded-[4rem] blur-2xl group-hover:bg-primary-600/5 transition-all duration-700"></div>
        <div className="relative bg-white rounded-[3.5rem] p-4 border-[6px] border-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Driver Cockpit Section */}
          <div className="mb-8 border-b border-slate-100 pb-6 pt-4 px-4 flex justify-between items-end">
            {/* Steering Wheel Icon */}
            <div className="w-14 h-14 bg-slate-50 rounded-full border-4 border-slate-200 flex items-center justify-center shadow-inner">
              <div className="w-10 h-10 rounded-full border-2 border-slate-400 flex items-center justify-center">
                <div className="w-1 h-6 bg-slate-400 rounded-full rotate-45 absolute"></div>
                <div className="w-1 h-6 bg-slate-400 rounded-full -rotate-45 absolute"></div>
                <div className="w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-400 z-10"></div>
              </div>
            </div>

            {/* Dashboard detail & Entry Door */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-col gap-1.5 items-end">
                <div className="w-10 h-1 bg-slate-100 rounded-full"></div>
                <div className="w-6 h-1 bg-slate-100 rounded-full"></div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Porte</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-2">
            {Object.keys(seatsByRow).sort().map((row) => (
              <div key={row} className="flex items-center gap-4">
                <div className="flex-1 flex items-center justify-between">
                  {/* Left Side (2 seats) */}
                  <div className="flex gap-2">
                    {seatsByRow[row].slice(0, 2).map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => seat.isAvailable && onSeatSelect(seat.id)}
                        disabled={!seat.isAvailable}
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center 
                          font-black text-xs transition-all duration-500
                          border-2 transform hover:scale-110 active:scale-95
                          ${getSeatColor(seat)}
                        `}
                      >
                        {seat.seatNumber.replace(/\D/g, '')}
                      </button>
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="w-8 flex items-center justify-center">
                    <div className="h-10 w-px bg-slate-50"></div>
                  </div>

                  {/* Right Side (2 seats) */}
                  <div className="flex gap-2">
                    {seatsByRow[row].slice(2, 4).map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => seat.isAvailable && onSeatSelect(seat.id)}
                        disabled={!seat.isAvailable}
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center 
                          font-black text-xs transition-all duration-500
                          border-2 transform hover:scale-110 active:scale-95
                          ${getSeatColor(seat)}
                        `}
                      >
                        {seat.seatNumber.replace(/\D/g, '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Engine / Back Section */}
          <div className="mt-8 border-t border-slate-100 pt-6 pb-2 text-center">
            <div className="inline-flex flex-col items-center gap-1 opacity-40">
              <div className="w-16 h-1 bg-slate-100 rounded-full"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Moteur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation de sélection élégante */}
      {effectiveSelectedIds.length > 0 && (
        <div className="bg-white/50 backdrop-blur-md border border-primary-100 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-sm mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mb-1">Siège(s) sélectionné(s)</p>
              <div className="flex flex-wrap gap-2">
                {effectiveSelectedIds.map(id => (
                  <span key={id} className="text-xl font-black text-gray-900">
                    {seats.find(s => s.id === id)?.seatNumber}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
