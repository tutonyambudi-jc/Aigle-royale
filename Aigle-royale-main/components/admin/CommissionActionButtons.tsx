'use client'

import { useState } from 'react'
import { markCommissionAsPaid, markCommissionAsPending } from '@/app/admin/commissions/actions'

interface CommissionActionButtonsProps {
    commissionId: string
    status: string
}

export function CommissionActionButtons({ commissionId, status }: CommissionActionButtonsProps) {
    const [loading, setLoading] = useState(false)

    const handleMarkAsPaid = async () => {
        if (!confirm('Marquer cette commission comme payée ?')) return

        setLoading(true)
        const result = await markCommissionAsPaid(commissionId)
        setLoading(false)

        if (!result.success) {
            alert(result.error || 'Une erreur est survenue')
        }
    }

    const handleMarkAsPending = async () => {
        if (!confirm('Marquer cette commission comme en attente ?')) return

        setLoading(true)
        const result = await markCommissionAsPending(commissionId)
        setLoading(false)

        if (!result.success) {
            alert(result.error || 'Une erreur est survenue')
        }
    }

    if (status === 'PAID') {
        return (
            <button
                onClick={handleMarkAsPending}
                disabled={loading}
                className="text-yellow-600 hover:text-yellow-800 font-medium text-sm disabled:opacity-50"
            >
                {loading ? 'Chargement...' : 'Marquer en attente'}
            </button>
        )
    }

    return (
        <button
            onClick={handleMarkAsPaid}
            disabled={loading}
            className="text-green-600 hover:text-green-800 font-medium text-sm disabled:opacity-50"
        >
            {loading ? 'Chargement...' : 'Marquer comme payée'}
        </button>
    )
}
