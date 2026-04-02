'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Réglages stockés en base (table settings) : sièges + frais de service.
 * Utilisé sur la page Paramètres centralisés.
 */
export function SystemBookingSettingsForm() {
  const router = useRouter()
  const [seatSelectionKey, setSeatSelectionKey] = useState<'id' | 'seatNumber'>('id')
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false)
  const [serviceFeeMode, setServiceFeeMode] = useState<'NONE' | 'FIXED' | 'PERCENT'>('NONE')
  const [serviceFeeValue, setServiceFeeValue] = useState('0')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const keys = ['seatSelectionKey', 'serviceFeeEnabled', 'serviceFeeMode', 'serviceFeeValue']
      const responses = await Promise.all(keys.map((key) => fetch(`/api/admin/settings?key=${key}`)))
      const jsons = await Promise.all(responses.map((res) => (res.ok ? res.json() : null)))
      for (const data of jsons) {
        if (!data?.key) continue
        if (data.key === 'seatSelectionKey' && data.value) {
          setSeatSelectionKey(data.value as 'id' | 'seatNumber')
        }
        if (data.key === 'serviceFeeEnabled') {
          setServiceFeeEnabled(data.value === 'true')
        }
        if (data.key === 'serviceFeeMode' && data.value) {
          setServiceFeeMode(data.value as 'NONE' | 'FIXED' | 'PERCENT')
        }
        if (data.key === 'serviceFeeValue') {
          setServiceFeeValue(String(data.value ?? '0'))
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const settingUpdates = [
        { key: 'seatSelectionKey', value: seatSelectionKey },
        { key: 'serviceFeeEnabled', value: String(serviceFeeEnabled) },
        { key: 'serviceFeeMode', value: serviceFeeMode },
        { key: 'serviceFeeValue', value: String(Math.max(0, Number(serviceFeeValue) || 0)) },
      ]

      const responses = await Promise.all(
        settingUpdates.map((payload) =>
          fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      )

      if (responses.every((r) => r.ok)) {
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' })
      } else {
        setMessage({ type: 'error', text: "Erreur lors de l'enregistrement" })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur serveur' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Réservation & billetterie</h2>
      <p className="text-sm text-gray-600 mb-6">
        Identification des sièges et frais de service appliqués aux billets (également modifiable sous « Frais de service » dans ce hub).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de sélection des sièges</label>
          <p className="text-sm text-gray-600 mb-4">
            Choisissez comment les sièges sont identifiés lors de la réservation
          </p>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="seatSelectionKey"
                value="id"
                checked={seatSelectionKey === 'id'}
                onChange={(e) => setSeatSelectionKey(e.target.value as 'id' | 'seatNumber')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">ID unique du siège</div>
                <div className="text-sm text-gray-600">
                  Utilise l&apos;identifiant unique de chaque siège (recommandé)
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="seatSelectionKey"
                value="seatNumber"
                checked={seatSelectionKey === 'seatNumber'}
                onChange={(e) => setSeatSelectionKey(e.target.value as 'id' | 'seatNumber')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Numéro de siège</div>
                <div className="text-sm text-gray-600">Utilise le numéro visible du siège (ex: A1, B2)</div>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frais de service / frais administratif
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Ces frais sont ajoutés automatiquement au total de chaque billet créé.
          </p>

          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={serviceFeeEnabled}
              onChange={(e) => setServiceFeeEnabled(e.target.checked)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-900">Activer les frais de service</span>
          </label>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de frais</label>
              <select
                value={serviceFeeMode}
                onChange={(e) => setServiceFeeMode(e.target.value as 'NONE' | 'FIXED' | 'PERCENT')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!serviceFeeEnabled}
              >
                <option value="NONE">Aucun</option>
                <option value="FIXED">Montant fixe (FC)</option>
                <option value="PERCENT">Pourcentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceFeeValue}
                onChange={(e) => setServiceFeeValue(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!serviceFeeEnabled || serviceFeeMode === 'NONE'}
              />
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
