'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Trip {
  id: string
  departureTime: Date
  arrivalTime: Date
  route: {
    origin: string
    destination: string
  }
}

interface FreightFormProps {
  onSuccess: (orderId: string) => void
}

export function FreightForm({ onSuccess }: FreightFormProps) {
  const [formData, setFormData] = useState({
    tripId: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    weight: '',
    type: '',
    value: '',
    notes: '',
  })
  const [trips, setTrips] = useState<Trip[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching cities:', err))
  }, [])

  useEffect(() => {
    if (searchParams.origin && searchParams.destination) {
      fetchTrips()
    }
  }, [searchParams])

  const fetchTrips = async () => {
    try {
      const response = await fetch(
        `/api/trips/search?origin=${encodeURIComponent(searchParams.origin)}&destination=${encodeURIComponent(searchParams.destination)}&date=${searchParams.date}`
      )
      const data = await response.json()
      setTrips(data)
    } catch (err) {
      console.error('Error fetching trips:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.tripId) {
      setError('Veuillez sélectionner un trajet')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight),
          value: formData.value ? parseFloat(formData.value) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      onSuccess(data.freightOrderId)
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Search */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechercher un trajet</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
                Ville de départ
              </label>
              <select
                id="origin"
                value={searchParams.origin}
                onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">— Sélectionner —</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                Ville d'arrivée
              </label>
              <select
                id="destination"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">— Sélectionner —</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Available Trips */}
        {trips.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner un trajet</h3>
            <div className="space-y-2">
              {trips.map((trip) => (
                <label
                  key={trip.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.tripId === trip.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="tripId"
                    value={trip.id}
                    checked={formData.tripId === trip.id}
                    onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {trip.route.origin} → {trip.route.destination}
                    </div>
                    <div className="text-sm text-gray-600">
                      Départ: {format(new Date(trip.departureTime), 'dd MMM yyyy à HH:mm')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sender Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'expéditeur</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="senderName"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="senderPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                id="senderPhone"
                value={formData.senderPhone}
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Receiver Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du destinataire</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="receiverName"
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="receiverPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                id="receiverPhone"
                value={formData.receiverPhone}
                onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du colis</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Poids (kg) *
              </label>
              <input
                type="number"
                id="weight"
                step="0.1"
                min="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type de colis
              </label>
              <input
                type="text"
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Documents, Vêtements"
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Valeur déclarée (FC)
              </label>
              <input
                type="number"
                id="value"
                step="100"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Instructions spéciales, description du contenu..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !formData.tripId}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Traitement...' : 'Créer la commande'}
          </button>
        </div>
      </form>
    </div>
  )
}
