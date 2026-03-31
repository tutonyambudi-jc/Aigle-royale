'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type CityStop = {
  id: string
  cityId: string
  name: string
  type: string
  address?: string | null
}

type City = {
  id: string
  name: string
  stops: CityStop[]
}

export function BusStopsManager({ initialCities }: { initialCities: City[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [newCityName, setNewCityName] = useState('')
  const [selectedCityId, setSelectedCityId] = useState(initialCities[0]?.id ?? '')
  const selectedCity = useMemo(
    () => initialCities.find((c) => c.id === selectedCityId),
    [initialCities, selectedCityId]
  )
  const [newStop, setNewStop] = useState({ name: '', type: 'BOTH', address: '' })

  const call = async (fn: () => Promise<Response>) => {
    setLoading(true)
    setNotice(null)
    try {
      const res = await fn()
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotice({ type: 'error', text: data?.error || 'Erreur' })
        return null
      }
      return data
    } catch {
      setNotice({ type: 'error', text: 'Une erreur est survenue' })
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCity = async () => {
    const data = await call(() =>
      fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName }),
      })
    )
    if (!data) return
    setNewCityName('')
    setNotice({ type: 'success', text: 'Ville créée.' })
    router.refresh()
  }

  const createStop = async () => {
    if (!selectedCityId) return
    const data = await call(() =>
      fetch(`/api/admin/cities/${selectedCityId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStop),
      })
    )
    if (!data) return
    setNewStop({ name: '', type: 'BOTH', address: '' })
    setNotice({ type: 'success', text: 'Arrêt ajouté.' })
    router.refresh()
  }

  if (!initialCities.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Créer des arrêts de bus</h2>
        <p className="text-sm text-gray-600">Créez d’abord une ville, puis ajoutez des arrêts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            notice.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Créer des arrêts de bus</h2>
        <p className="text-sm text-gray-600 mb-6">
          1) Créez une ville, 2) Ajoutez des arrêts d’embarquement/débarquement (gare, station, point de prise en charge).
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Créer une ville</label>
            <div className="flex gap-2">
              <input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Abidjan"
              />
              <button
                type="button"
                disabled={loading || !newCityName.trim()}
                onClick={createCity}
                className="px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  {initialCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom arrêt</label>
                <input
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Ex: Gare Adjamé"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newStop.type}
                  onChange={(e) => setNewStop({ ...newStop, type: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="EMBARK">Embarquement</option>
                  <option value="DISEMBARK">Débarquement</option>
                  <option value="BOTH">Embarquement & Débarquement</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse (optionnel)</label>
                <input
                  value={newStop.address}
                  onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Quartier, avenue, repère..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={loading || !selectedCityId || !newStop.name.trim()}
                  onClick={createStop}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50"
                >
                  Ajouter l’arrêt
                </button>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Arrêts de {selectedCity?.name ?? ''}</div>
              <div className="grid md:grid-cols-2 gap-2">
                {(selectedCity?.stops || []).map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-600">
                      {s.type} {s.address ? `• ${s.address}` : ''}
                    </div>
                  </div>
                ))}
                {(selectedCity?.stops || []).length === 0 && (
                  <div className="text-sm text-gray-600">Aucun arrêt pour cette ville.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

