'use client'

import { useEffect, useState } from 'react'
import { RatingBadge } from '@/components/ui/RatingBadge'

type CompanyReviewItem = {
  id: string
  rating: number
  comment: string | null
  isVerified: boolean
  isVisible: boolean
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
  company: { name: string }
}

export default function AdminCompanyReviewsPage() {
  const [reviews, setReviews] = useState<CompanyReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/companies/reviews', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erreur')
      setReviews(data.reviews || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleVisibility = async (review: CompanyReviewItem) => {
    setSavingId(review.id)
    try {
      const response = await fetch('/api/admin/companies/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, isVisible: !review.isVisible }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erreur')
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isVisible: data.review.isVisible } : r))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modération des avis compagnies</h1>
        <p className="text-gray-600">Masquer ou afficher les avis clients dans le classement public.</p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">Chargement des avis...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compagnie</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commentaire</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">{review.company.name}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{review.user.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <RatingBadge value={review.rating} variant="integer" size="sm" />
                  </td>
                  <td className="px-5 py-4 text-gray-700 text-sm">{review.comment || '—'}</td>
                  <td className="px-5 py-4">
                    {review.isVisible ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Visible</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Masqué</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleVisibility(review)}
                      disabled={savingId === review.id}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {savingId === review.id ? '...' : review.isVisible ? 'Masquer' : 'Afficher'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
