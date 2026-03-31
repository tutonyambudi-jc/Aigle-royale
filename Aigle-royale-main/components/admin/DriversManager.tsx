'use client'

import { useEffect, useMemo, useState } from 'react'

type BusLite = { id: string; name: string; plateNumber: string }
type DriverRow = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  licenseNumber: string | null
  busId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  bus?: BusLite | null
}

export function DriversManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [buses, setBuses] = useState<BusLite[]>([])

  const [q, setQ] = useState('')
  const [active, setActive] = useState<'ALL' | 'true' | 'false'>('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    busId: '',
  })

  const [editOpen, setEditOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<DriverRow | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    busId: '',
    isActive: true,
  })

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (active !== 'ALL') sp.set('active', active)
    sp.set('limit', '200')
    return sp.toString()
  }, [q, active])

  async function fetchDrivers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/drivers?${queryString}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Une erreur est survenue')
      setDrivers(Array.isArray(data.drivers) ? data.drivers : [])
      setBuses(Array.isArray(data.buses) ? data.buses : [])
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
      setDrivers([])
      setBuses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [queryString])

  async function createDriver() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de créer')
      setCreateOpen(false)
      setCreateForm({ firstName: '', lastName: '', phone: '', licenseNumber: '', busId: '' })
      await fetchDrivers()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function saveDriver() {
    if (!editDriver) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/drivers/${editDriver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de sauvegarder')
      setEditOpen(false)
      setEditDriver(null)
      await fetchDrivers()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function deactivateDriver(driverId: string) {
    if (!confirm('Désactiver ce chauffeur ?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de désactiver')
      await fetchDrivers()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, téléphone, permis, bus…"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
            />
          </div>
          <div className="w-full lg:w-56">
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select value={active} onChange={(e) => setActive(e.target.value as any)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white">
              <option value="ALL">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
            disabled={loading}
          >
            + Nouveau chauffeur
          </button>
          <a
            href="/logistics"
            className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-800"
          >
            Ouvrir planning
          </a>
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Téléphone</th>
                <th className="py-2 pr-4">Permis</th>
                <th className="py-2 pr-4">Bus (optionnel)</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-600">
                    Chargement…
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-600">
                    Aucun chauffeur.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {d.firstName} {d.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{d.phone || '-'}</td>
                    <td className="py-3 pr-4 text-gray-700">{d.licenseNumber || '-'}</td>
                    <td className="py-3 pr-4 text-gray-700">{d.bus ? `${d.bus.name} (${d.bus.plateNumber})` : '-'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {d.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditDriver(d)
                            setEditForm({
                              firstName: d.firstName,
                              lastName: d.lastName,
                              phone: d.phone || '',
                              licenseNumber: d.licenseNumber || '',
                              busId: d.busId || '',
                              isActive: d.isActive,
                            })
                            setEditOpen(true)
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => deactivateDriver(d.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 font-semibold text-red-800"
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-gray-900">Créer un chauffeur</div>
                <div className="text-sm text-gray-600">Affectation bus optionnelle.</div>
              </div>
              <button onClick={() => setCreateOpen(false)} className="text-gray-600 hover:text-gray-900 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">N° Permis</label>
                <input value={createForm.licenseNumber} onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus (optionnel)</label>
                <select value={createForm.busId} onChange={(e) => setCreateForm({ ...createForm, busId: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white">
                  <option value="">— Aucun —</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800">
                Annuler
              </button>
              <button onClick={createDriver} disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editOpen && editDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-gray-900">Modifier chauffeur</div>
                <div className="text-sm text-gray-600">
                  {editDriver.firstName} {editDriver.lastName}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditOpen(false)
                  setEditDriver(null)
                }}
                className="text-gray-600 hover:text-gray-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">N° Permis</label>
                <input value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus (optionnel)</label>
                <select value={editForm.busId} onChange={(e) => setEditForm({ ...editForm, busId: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white">
                  <option value="">— Aucun —</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                  Chauffeur actif
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditOpen(false)
                  setEditDriver(null)
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
              >
                Annuler
              </button>
              <button onClick={saveDriver} disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

