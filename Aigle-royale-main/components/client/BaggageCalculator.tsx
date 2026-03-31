'use client'

import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  BAGGAGE_STANDARD,
  baggageStandardIntroLineFr,
  calcBaggageExtrasXof,
  formatBaggageDimsCm,
} from '@/lib/baggage'

export function BaggageCalculator() {
  const [passengers, setPassengers] = useState<number>(1)
  const [extraPieces, setExtraPieces] = useState<number>(0)
  const [overweightKg, setOverweightKg] = useState<number>(0)

  const computed = useMemo(() => {
    const p = Number.isFinite(passengers) ? Math.max(1, Math.min(50, Math.floor(passengers))) : 1
    const checkedPieces = p * BAGGAGE_STANDARD.checked.maxPiecesPerPassenger
    const checkedTotalKg = checkedPieces * BAGGAGE_STANDARD.checked.maxKgPerPiece
    const carryPieces = p * BAGGAGE_STANDARD.carryOn.maxPiecesPerPassenger
    const carryTotalKg = carryPieces * BAGGAGE_STANDARD.carryOn.maxKgPerPiece
    return { p, checkedPieces, checkedTotalKg, carryPieces, carryTotalKg }
  }, [passengers])

  const extraCost = useMemo(() => {
    return calcBaggageExtrasXof({ extraPieces, overweightKg })
  }, [extraPieces, overweightKg])

  return (
    <div className="max-w-4xl mx-auto mb-16 relative z-20">
      <div className="glass rounded-2xl p-8 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">Calculateur de bagages autorisés</h3>
            <p className="text-gray-600 mt-2">{baggageStandardIntroLineFr()}</p>
          </div>
          <div className="bg-white/70 rounded-2xl p-4 border border-gray-200/70 w-full md:w-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de passagers</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={50}
                value={computed.p}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 font-bold"
              />
              <div className="text-xs text-gray-500">max 50</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/70 rounded-2xl p-6 border border-gray-200/70">
            <div className="text-sm font-semibold text-gray-500 mb-2">Bagages soute</div>
            <div className="text-3xl font-extrabold text-gray-900 mb-2">{computed.checkedPieces} pièces</div>
            <div className="text-gray-700">
              Total: <span className="font-bold">{computed.checkedTotalKg} kg</span>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Par pièce: {BAGGAGE_STANDARD.checked.maxKgPerPiece} kg • Dimensions max (standard):{' '}
              {formatBaggageDimsCm(BAGGAGE_STANDARD.checked.maxDimsCm)}
            </div>
          </div>

          <div className="bg-white/70 rounded-2xl p-6 border border-gray-200/70">
            <div className="text-sm font-semibold text-gray-500 mb-2">Bagage à main</div>
            <div className="text-3xl font-extrabold text-gray-900 mb-2">{computed.carryPieces} pièce(s)</div>
            <div className="text-gray-700">
              Total: <span className="font-bold">{computed.carryTotalKg} kg</span>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Par pièce: {BAGGAGE_STANDARD.carryOn.maxKgPerPiece} kg • Dimensions max (standard):{' '}
              {formatBaggageDimsCm(BAGGAGE_STANDARD.carryOn.maxDimsCm)}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Remarque: ces limites suivent un modèle standard pour le transport en bus. Les conditions peuvent varier selon la ligne et le bus.
        </p>

        <div className="mt-6 bg-white/70 rounded-2xl p-6 border border-gray-200/70">
          <h4 className="text-lg font-extrabold text-gray-900 mb-2">Bagages supplémentaires (payants)</h4>
          <p className="text-sm text-gray-600">
            Si vous dépassez la limite, vous pouvez ajouter un supplément (à payer pendant la réservation ou auprès d’un agent).
          </p>

          <div className="mt-4 grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pièces en soute supplémentaires</label>
              <input
                type="number"
                min={0}
                value={extraPieces}
                onChange={(e) => setExtraPieces(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Surpoids total (kg)</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={overweightKg}
                onChange={(e) => setOverweightKg(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 font-bold"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Supplément estimé</div>
              <div className="text-2xl font-extrabold text-primary-700">{formatCurrency(extraCost)}</div>
              <div className="text-xs text-gray-500 mt-1">Tarifs configurables (admin / agence).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

