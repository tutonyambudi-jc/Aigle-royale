'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_FREIGHT_PRICE_PER_KG_FC } from '@/lib/freight-pricing'

type CompanyRow = {
  id: string
  name: string
  freightPricePerKg: number
}

export function FreightCompanyPricingForm() {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/companies')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      const list = (data.companies || []) as CompanyRow[]
      setCompanies(list)
      const d: Record<string, string> = {}
      for (const c of list) {
        d[c.id] = String(c.freightPricePerKg ?? DEFAULT_FREIGHT_PRICE_PER_KG_FC)
      }
      setDrafts(d)
    } catch {
      setMessage({ type: 'error', text: 'Impossible de charger les compagnies.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (id: string) => {
    const raw = drafts[id]?.trim()
    const n = raw === undefined || raw === '' ? NaN : parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(n) || n < 0) {
      setMessage({ type: 'error', text: 'Saisissez un nombre positif ou zéro.' })
      return
    }
    setSavingId(id)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freightPricePerKg: n }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, freightPricePerKg: data.freightPricePerKg } : c)))
      setDrafts((prev) => ({ ...prev, [id]: String(data.freightPricePerKg) }))
      setMessage({ type: 'success', text: 'Tarif fret enregistré pour cette compagnie.' })
    } catch {
      setMessage({ type: 'error', text: 'Enregistrement impossible.' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div id="freight-pricing" className="scroll-mt-24 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Fret — prix au kilogramme par compagnie</h2>
      <p className="text-sm text-gray-600 mb-6">
        Chaque compagnie de transport applique son propre tarif au kg pour les colis. Les trajets utilisent le bus
        rattaché à une compagnie : le prix facturé est <span className="font-medium text-gray-800">poids × tarif de la
        compagnie du bus</span>. Si un bus n’a pas de compagnie, le tarif par défaut ({DEFAULT_FREIGHT_PRICE_PER_KG_FC}{' '}
        FC/kg) s’applique.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
          Aucune compagnie en base. Créez une compagnie lors de l’ajout d’un bus ou importez vos données.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-700">
                <th className="px-4 py-3 font-semibold">Compagnie</th>
                <th className="px-4 py-3 font-semibold w-48">Prix / kg (FC)</th>
                <th className="px-4 py-3 font-semibold w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={drafts[c.id] ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => save(c.id)}
                      disabled={savingId === c.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                    >
                      {savingId === c.id ? '…' : 'Enregistrer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
