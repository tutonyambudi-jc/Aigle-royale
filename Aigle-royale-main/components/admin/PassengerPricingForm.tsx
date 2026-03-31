'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PassengerPricing {
  id: string
  passengerType: string
  discountPercent: number
  minAge: number | null
  maxAge: number | null
  description: string | null
  isActive: boolean
  requiresDisabilityProof: boolean
}

export function PassengerPricingForm({ rule }: { rule: PassengerPricing }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    discountPercent: rule.discountPercent,
    minAge: rule.minAge ?? 0,
    maxAge: rule.maxAge ?? 100,
    description: rule.description ?? '',
    isActive: rule.isActive,
    requiresDisabilityProof: rule.requiresDisabilityProof,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/passenger-pricing/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Échec de la mise à jour')
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating pricing:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        ✏️ Modifier
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Réduction (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={formData.discountPercent}
          onChange={(e) =>
            setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Âge min
          </label>
          <input
            type="number"
            min="0"
            value={formData.minAge}
            onChange={(e) =>
              setFormData({ ...formData, minAge: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Âge max
          </label>
          <input
            type="number"
            min="0"
            value={formData.maxAge}
            onChange={(e) =>
              setFormData({ ...formData, maxAge: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`active-${rule.id}`}
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-primary-600"
        />
        <label htmlFor={`active-${rule.id}`} className="text-sm font-semibold text-gray-700">
          Actif
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : '✓ Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData({
              discountPercent: rule.discountPercent,
              minAge: rule.minAge ?? 0,
              maxAge: rule.maxAge ?? 100,
              description: rule.description ?? '',
              isActive: rule.isActive,              requiresDisabilityProof: false,            })
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
        >
          ✕
        </button>
      </div>
    </form>
  )
}
