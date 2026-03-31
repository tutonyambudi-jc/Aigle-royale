'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface City {
  id: string
  name: string
}

interface CityStop {
  id: string
  name: string
  address?: string
  isActive: boolean
  city: {
    name: string
  }
  cityId: string
}

export default function CityStopsPage() {
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [stops, setStops] = useState<CityStop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStop, setEditingStop] = useState<CityStop | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    cityId: '',
    name: '',
    address: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [citiesRes, stopsRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/admin/city-stops')
      ])

      if (citiesRes.ok) setCities(await citiesRes.json())
      if (stopsRes.ok) setStops(await stopsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cityId || !formData.name) return

    setSaving(true)
    setMessage(null)

    try {
      const url = editingStop 
        ? `/api/admin/city-stops/${editingStop.id}`
        : '/api/admin/city-stops'
      
      const method = editingStop ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingStop ? 'Arrêt modifié avec succès' : 'Arrêt ajouté avec succès' 
        })
        setFormData({ cityId: '', name: '', address: '' })
        setEditingStop(null)
        fetchData()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur serveur' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (stop: CityStop) => {
    setEditingStop(stop)
    setFormData({
      cityId: stop.cityId,
      name: stop.name,
      address: stop.address || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet arrêt ?')) return

    try {
      const response = await fetch(`/api/admin/city-stops/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Arrêt désactivé avec succès' })
        fetchData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  const handleCancel = () => {
    setEditingStop(null)
    setFormData({ cityId: '', name: '', address: '' })
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
            onClick={() => router.push('/admin')}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'admin
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Arrêts de Ville
          </h1>
          <p className="text-gray-600 mb-6">
            Créez et gérez les arrêts disponibles dans chaque ville
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <select
                  value={formData.cityId}
                  onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  required
                >
                  <option value="">Sélectionner une ville</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'arrêt *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gare routière principale"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'En cours...' : editingStop ? 'Modifier' : 'Ajouter l\'arrêt'}
              </button>
              {editingStop && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Arrêts existants ({stops.length})
            </h2>

            {stops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun arrêt créé. Ajoutez votre premier arrêt ci-dessus.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{stop.name}</h3>
                        <p className="text-sm text-gray-600">{stop.city.name}</p>
                        {stop.address && (
                          <p className="text-xs text-gray-500 mt-1">{stop.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(stop)}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(stop.id)}
                        className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        🗑️ Supprimer
                      </button>
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
