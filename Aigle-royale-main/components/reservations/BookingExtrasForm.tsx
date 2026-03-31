'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { BAGGAGE_STANDARD, calcBaggageExtrasXof } from '@/lib/baggage'

type Meal = {
  id: string
  name: string
  description: string | null
  price: number
}

export function BookingExtrasForm({
  bookingId,
  tripPrice,
  initialMealId,
  initialWifiPass,
  initialExtraBaggagePieces,
  initialExtraBaggageOverweightKg,
  meals,
  currency,
  wifiPriceXof,
}: {
  bookingId: string
  tripPrice: number
  initialMealId: string | null
  initialWifiPass: boolean
  initialExtraBaggagePieces: number
  initialExtraBaggageOverweightKg: number
  meals: Meal[]
  currency: DisplayCurrency
  wifiPriceXof: number
}) {
  const [mealId, setMealId] = useState<string | null>(initialMealId)
  const [wifiPass, setWifiPass] = useState<boolean>(initialWifiPass)
  const [extraBaggagePieces, setExtraBaggagePieces] = useState<number>(initialExtraBaggagePieces || 0)
  const [extraBaggageOverweightKg, setExtraBaggageOverweightKg] = useState<number>(initialExtraBaggageOverweightKg || 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedMeal = useMemo(() => meals.find((m) => m.id === mealId) || null, [meals, mealId])
  const baggageExtras = useMemo(
    () => calcBaggageExtrasXof({ extraPieces: extraBaggagePieces, overweightKg: extraBaggageOverweightKg }),
    [extraBaggagePieces, extraBaggageOverweightKg]
  )
  const extrasTotal = (selectedMeal?.price || 0) + (wifiPass ? wifiPriceXof : 0) + baggageExtras
  const total = tripPrice + extrasTotal

  const save = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extras`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId, wifiPass, extraBaggagePieces, extraBaggageOverweightKg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      <div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Réserver un repas</h2>
        <p className="text-gray-600 text-sm">Sélectionnez un repas à bord (optionnel).</p>
        <div className="mt-4 grid gap-2">
          <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="meal"
                checked={mealId === null}
                onChange={() => setMealId(null)}
              />
              <div>
                <div className="font-bold text-gray-900">Aucun repas</div>
                <div className="text-xs text-gray-600">Je n’ajoute pas de repas.</div>
              </div>
            </div>
            <div className="font-bold text-gray-900">{formatCurrency(0, currency)}</div>
          </label>

          {meals.map((m) => (
            <label key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="meal"
                  checked={mealId === m.id}
                  onChange={() => setMealId(m.id)}
                />
                <div>
                  <div className="font-bold text-gray-900">{m.name}</div>
                  {m.description && <div className="text-xs text-gray-600">{m.description}</div>}
                </div>
              </div>
              <div className="font-extrabold text-primary-700">{formatCurrency(m.price, currency)}</div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Accès Wi‑Fi</h2>
        <p className="text-gray-600 text-sm">Ajoutez un pass Wi‑Fi à votre réservation (optionnel).</p>

        <label className="mt-3 flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={wifiPass} onChange={(e) => setWifiPass(e.target.checked)} />
            <div>
              <div className="font-bold text-gray-900">Pass Wi‑Fi</div>
              <div className="text-xs text-gray-600">Accès internet à bord (selon disponibilité).</div>
            </div>
          </div>
          <div className="font-extrabold text-primary-700">{formatCurrency(wifiPriceXof, currency)}</div>
        </label>
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Bagages supplémentaires</h2>
        <p className="text-gray-600 text-sm">
          Déclarez vos bagages au-delà de la limite standard. Le supplément est ajouté au total (optionnel).
        </p>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pièces en soute supplémentaires</label>
            <input
              type="number"
              min={0}
              value={extraBaggagePieces}
              onChange={(e) => setExtraBaggagePieces(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            />
            <div className="mt-2 text-xs text-gray-600">
              Nombre de pièces au-delà de la limite ({BAGGAGE_STANDARD.checked.maxPiecesPerPassenger} pièces /
              passager).
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Surpoids total (kg)</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={extraBaggageOverweightKg}
              onChange={(e) => setExtraBaggageOverweightKg(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            />
            <div className="mt-2 text-xs text-gray-600">
              Total kg au-delà des limites ({BAGGAGE_STANDARD.checked.maxKgPerPiece} kg / pièce en soute).
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-600">Supplément bagages estimé</span>
          <span className="font-extrabold text-primary-700">{formatCurrency(baggageExtras, currency)}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Billet</span>
          <span className="font-bold text-gray-900">{formatCurrency(tripPrice, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Extras</span>
          <span className="font-bold text-gray-900">{formatCurrency(extrasTotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-lg">
          <span className="font-extrabold text-gray-900">Total</span>
          <span className="font-extrabold text-primary-700">{formatCurrency(total, currency)}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Link href="/reservations" className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 font-bold text-gray-800 hover:bg-gray-50">
          ← Mes réservations
        </Link>
        <div className="flex gap-3 justify-end">
          <button
            onClick={save}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-extrabold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

