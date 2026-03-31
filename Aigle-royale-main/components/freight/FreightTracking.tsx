'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface TrackingResult {
  id: string
  trackingCode: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  weight: number
  type: string | null
  value: number | null
  price: number
  status: string
  notes: string | null
  createdAt: Date
  trip: {
    route: {
      origin: string
      destination: string
    }
    departureTime: Date
    arrivalTime: Date
    bus: {
      name: string
    }
  }
  payment: {
    status: string
  } | null
}

export function FreightTracking() {
  const [trackingCode, setTrackingCode] = useState('')
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    if (!trackingCode.trim()) {
      setError('Veuillez entrer un code de suivi')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/freight?trackingCode=${encodeURIComponent(trackingCode.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Colis introuvable')
        setLoading(false)
        return
      }

      setResult(data)
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Reçu'
      case 'IN_TRANSIT':
        return 'En transit'
      case 'DELIVERED':
        return 'Livré'
      case 'CANCELLED':
        return 'Annulé'
      default:
        return status
    }
  }

  const getStatusSteps = (status: string) => {
    const steps = [
      { label: 'Reçu', status: 'RECEIVED', completed: true },
      { label: 'En transit', status: 'IN_TRANSIT', completed: ['IN_TRANSIT', 'DELIVERED'].includes(status) },
      { label: 'Livré', status: 'DELIVERED', completed: status === 'DELIVERED' },
    ]
    return steps
  }

  return (
    <div className="space-y-6">
      {/* Formulaire de recherche */}
      <form onSubmit={handleTrack} className="bg-gray-50 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de suivi
            </label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="Ex: FR-XXXXX-XXXXX"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white font-mono text-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Suivre'}
            </button>
          </div>
        </div>
      </form>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Code de suivi</div>
                <div className="text-2xl font-bold font-mono">{result.trackingCode}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Statut</div>
                <span className={`px-4 py-2 rounded-lg text-sm font-bold bg-white/20 backdrop-blur-sm`}>
                  {getStatusLabel(result.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suivi du colis</h3>
            <div className="space-y-4">
              {getStatusSteps(result.status).map((step, index) => (
                <div key={step.status} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-current"></div>
                      )}
                    </div>
                    {index < getStatusSteps(result.status).length - 1 && (
                      <div className={`w-0.5 h-8 ml-5 ${
                        getStatusSteps(result.status)[index + 1].completed 
                          ? 'bg-primary-600' 
                          : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className={`font-semibold ${
                      step.completed ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </div>
                    {step.completed && step.status === result.status && (
                      <div className="text-sm text-gray-600 mt-1">
                        {result.status === 'RECEIVED' && `Reçu le ${format(new Date(result.createdAt), 'dd MMMM yyyy à HH:mm')}`}
                        {result.status === 'IN_TRANSIT' && `En transit depuis le ${format(new Date(result.createdAt), 'dd MMMM yyyy')}`}
                        {result.status === 'DELIVERED' && `Livré le ${format(new Date(result.createdAt), 'dd MMMM yyyy à HH:mm')}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Détails */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Expéditeur</h4>
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900">{result.senderName}</div>
                  <div className="text-sm text-gray-600">{result.senderPhone}</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Destinataire</h4>
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900">{result.receiverName}</div>
                  <div className="text-sm text-gray-600">{result.receiverPhone}</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6 pt-6 border-t border-gray-200">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Trajet</h4>
                <div className="font-semibold text-gray-900">
                  {result.trip.route.origin} → {result.trip.route.destination}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Bus: {result.trip.bus.name}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Informations</h4>
                <div className="text-gray-900 font-semibold">{result.weight} kg</div>
                {result.type && (
                  <div className="text-sm text-gray-600">Type: {result.type}</div>
                )}
                {result.value && (
                  <div className="text-sm text-gray-600">Valeur: {formatCurrency(result.value)}</div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Paiement</h4>
                <div className="text-gray-900 font-semibold">{formatCurrency(result.price)}</div>
                <div className="text-sm text-gray-600">
                  Statut: {result.payment?.status === 'PAID' ? 'Payé' : 'En attente'}
                </div>
              </div>
            </div>

            {result.notes && (
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Notes</h4>
                <p className="text-gray-700">{result.notes}</p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <Link
                href={`/freight/${result.id}`}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors text-center"
              >
                Voir les détails complets
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
