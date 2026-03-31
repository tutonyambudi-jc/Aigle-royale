'use client'

import { useState } from 'react'
import { updateAgentCommissionRate, updateGlobalCommissionRate } from '@/app/admin/commissions/actions'

interface CommissionRateFormProps {
    type: 'global' | 'agent'
    agentId?: string
    currentRate?: number
}

export function CommissionRateForm({ type, agentId, currentRate = 10 }: CommissionRateFormProps) {
    const [rate, setRate] = useState(currentRate.toString())
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const numRate = parseFloat(rate)
        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            setError('Le taux doit être entre 0 et 100%')
            setLoading(false)
            return
        }

        const result = type === 'global'
            ? await updateGlobalCommissionRate(numRate)
            : await updateAgentCommissionRate(agentId!, numRate)

        setLoading(false)

        if (!result.success) {
            setError(result.error || 'Une erreur est survenue')
        } else {
            setShowForm(false)
            setRate(numRate.toString())
        }
    }

    if (type === 'global') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nouveau taux global (%)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="10"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Application...' : 'Appliquer à tous'}
                    </button>
                </div>
                <p className="text-xs text-gray-500">
                    ⚠️ Cette action modifiera le taux de commission de tous les agents.
                </p>
            </form>
        )
    }

    // Type agent
    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="text-primary-600 hover:text-primary-800 font-medium text-sm"
            >
                Modifier
            </button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-20 px-2 py-1 border-2 border-gray-200 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="10"
                required
                autoFocus
            />
            <span className="text-sm text-gray-600">%</span>
            <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
                {loading ? '...' : 'OK'}
            </button>
            <button
                type="button"
                onClick={() => {
                    setShowForm(false)
                    setRate(currentRate.toString())
                    setError('')
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
            >
                ✕
            </button>
            {error && (
                <span className="text-xs text-red-600">{error}</span>
            )}
        </form>
    )
}
