'use client'

import { useState } from 'react'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onCancel = async () => {
    if (!confirm('Annuler cette réservation ?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Annulation impossible')
      window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 font-bold hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? 'Annulation…' : 'Annuler'}
      </button>
      {error && <div className="text-xs text-red-700">{error}</div>}
    </div>
  )
}

