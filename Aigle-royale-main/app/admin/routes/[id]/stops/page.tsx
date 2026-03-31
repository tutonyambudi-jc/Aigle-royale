'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface CityStop {
  id: string
  name: string
  address?: string
  city: {
    name: string
  }
}

interface RouteStop {
  id: string
  order: number
  role: string
  notes?: string
  stop: CityStop
}

export default function RouteStopsPage() {
  const router = useRouter()
  const params = useParams()
  const routeId = typeof params?.id === 'string' ? params.id : undefined
  const [route, setRoute] = useState<any>(null)
  const [stops, setStops] = useState<RouteStop[]>([])
  const [availableStops, setAvailableStops] = useState<CityStop[]>([])
  const [selectedStopId, setSelectedStopId] = useState('')
  const [stopRole, setStopRole] = useState<'BOARDING' | 'ALIGHTING' | 'STOP' | 'EMBARQUEMENT' | 'DEBARQUEMENT'>('STOP')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null)

  const fetchRouteAndStops = useCallback(async () => {
    if (!routeId) return
    try {
      const [routeRes, stopsRes, availableStopsRes] = await Promise.all([
        fetch(`/api/admin/routes/${routeId}`),
        fetch(`/api/admin/routes/${routeId}/stops`),
        fetch('/api/admin/city-stops')
      ])

      if (routeRes.ok) setRoute(await routeRes.json())
      if (stopsRes.ok) setStops(await stopsRes.json())
      if (availableStopsRes.ok) setAvailableStops(await availableStopsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => {
    if (!routeId) {
      setLoading(false)
      return
    }
    fetchRouteAndStops()
  }, [routeId, fetchRouteAndStops])

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStopId || !routeId) return

    setSaving(true)
    setMessage(null)

    try {
      const url = editingStop 
        ? `/api/admin/routes/${routeId}/stops/${editingStop.id}`
        : `/api/admin/routes/${routeId}/stops`
      
      const method = editingStop ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopId: selectedStopId,
          order: editingStop ? editingStop.order : stops.length + 1,
          role: stopRole,
          notes
        })
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingStop ? 'Arrêt modifié avec succès' : 'Arrêt ajouté avec succès' 
        })
        setSelectedStopId('')
        setNotes('')
        setEditingStop(null)
        fetchRouteAndStops()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'opération' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur serveur' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStop = async (stopId: string) => {
    if (!routeId) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arrêt ?')) return

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Arrêt supprimé avec succès' })
        fetchRouteAndStops()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  const handleEditStop = (stop: RouteStop) => {
    setEditingStop(stop)
    setSelectedStopId(stop.stop.id)
    setStopRole(stop.role as any)
    setNotes(stop.notes || '')
  }

  const handleCancelEdit = () => {
    setEditingStop(null)
    setSelectedStopId('')
    setStopRole('STOP')
    setNotes('')
  }

  const handleReorder = async (stopId: string, direction: 'up' | 'down') => {
    if (!routeId) return
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      })

      if (response.ok) {
        fetchRouteAndStops()
      }
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  if (!routeId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-gray-600">Identifiant de route invalide.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/routes')}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux routes
          </button>
        </div>

        {route && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des arrêts intermédiaires
            </h1>
            <p className="text-lg text-gray-600">
              Route : <span className="font-semibold">{route.origin}</span> → <span className="font-semibold">{route.destination}</span>
            </p>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulaire d'ajout */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingStop ? 'Modifier l\'arrêt' : 'Ajouter un arrêt'}
            </h2>
            <form onSubmit={handleAddStop} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un arrêt
                </label>
                <select
                  value={selectedStopId}
                  onChange={(e) => setSelectedStopId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">-- Choisir un arrêt --</option>
                  {availableStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.city.name} - {stop.name} {stop.address && `(${stop.address})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'arrêt
                </label>
                <select
                  value={stopRole}
                  onChange={(e) => setStopRole(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="STOP">Arrêt complet (embarquement & débarquement)</option>
                  <option value="BOARDING">Embarquement uniquement (BOARDING)</option>
                  <option value="ALIGHTING">Débarquement uniquement (ALIGHTING)</option>
                  <option value="EMBARQUEMENT">Embarquement uniquement</option>
                  <option value="DEBARQUEMENT">Débarquement uniquement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                  placeholder="Informations supplémentaires..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || !selectedStopId}
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'En cours...' : editingStop ? 'Modifier l\'arrêt' : 'Ajouter l\'arrêt'}
                </button>
                {editingStop && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Liste des arrêts */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Arrêts configurés ({stops.length})
            </h2>
            {stops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun arrêt intermédiaire configuré
              </p>
            ) : (
              <div className="space-y-3">
                {stops
                  .sort((a, b) => a.order - b.order)
                  .map((stop, index) => (
                    <div
                      key={stop.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                              {stop.order}
                            </span>
                            <h3 className="font-semibold text-gray-900">
                              {stop.stop.city.name} - {stop.stop.name}
                            </h3>
                          </div>
                          {stop.stop.address && (
                            <p className="text-sm text-gray-600 ml-8">{stop.stop.address}</p>
                          )}
                          <div className="flex items-center gap-2 ml-8 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                stop.role === 'BOARDING' || stop.role === 'EMBARQUEMENT'
                                  ? 'bg-green-100 text-green-700'
                                  : stop.role === 'ALIGHTING' || stop.role === 'DEBARQUEMENT'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {stop.role === 'BOARDING' || stop.role === 'EMBARQUEMENT'
                                ? '🔼 Embarquement'
                                : stop.role === 'ALIGHTING' || stop.role === 'DEBARQUEMENT'
                                ? '🔽 Débarquement'
                                : '↕️ Complet'}
                            </span>
                          </div>
                          {stop.notes && (
                            <p className="text-sm text-gray-500 ml-8 mt-2">{stop.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReorder(stop.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Monter"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReorder(stop.id, 'down')}
                            disabled={index === stops.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Descendre"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditStop(stop)}
                            className="p-1 text-blue-400 hover:text-blue-600"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStop(stop.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
