'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

type Meal = {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  createdAt: string
}

async function fetcher(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Erreur')
  return data
}

export function MealsManager() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetcher('/api/admin/meals')
      setMeals(data.meals || [])
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activeCount = useMemo(() => meals.filter((m) => m.isActive).length, [meals])

  const createMeal = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price, isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      setName('')
      setDescription('')
      setPrice(0)
      setIsActive(true)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (meal: Meal) => {
    setError('')
    try {
      const res = await fetch(`/api/admin/meals/${meal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !meal.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    }
  }

  const removeMeal = async (meal: Meal) => {
    if (!confirm(`Supprimer “${meal.name}” ?`)) return
    setError('')
    try {
      const res = await fetch(`/api/admin/meals/${meal.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Repas à bord</h2>
            <p className="text-gray-600">Créer et activer/désactiver les repas réservables.</p>
          </div>
          <div className="text-sm text-gray-600">
            Actifs: <span className="font-bold text-gray-900">{activeCount}</span> / {meals.length}
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

        <div className="mt-6 grid md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-gray-700">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="Ex: Poulet braisé"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="Ex: Avec attiéké + sauce"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-gray-700">Prix (FC)</label>
            <input
              type="number"
              value={Number.isFinite(price) ? price : 0}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200"
              min={0}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Actif
          </label>
          <button
            onClick={createMeal}
            disabled={saving || !name.trim() || !(Number.isFinite(price) && price >= 0)}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-extrabold hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : '+ Ajouter'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900">Liste</h3>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-bold hover:bg-gray-200">
            Rafraîchir
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-gray-600">Chargement…</div>
        ) : meals.length === 0 ? (
          <div className="p-8 text-gray-600">Aucun repas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Prix</th>
                  <th className="text-center p-3">Statut</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3 font-semibold text-gray-900">{m.name}</td>
                    <td className="p-3 text-gray-600">{m.description || '—'}</td>
                    <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(m.price)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {m.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleActive(m)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 mr-2"
                      >
                        {m.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => removeMeal(m)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

