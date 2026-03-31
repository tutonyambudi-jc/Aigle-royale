'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RatingBadge } from '@/components/ui/RatingBadge'

type RankedCompany = {
  id: string
  name: string
  busesCount: number
  reviewsCount: number
  avgRating: number
  recommended: boolean
  rank: number
}

type RankingResponse = {
  ranked: RankedCompany[]
}

export default function DashboardReviewsPage() {
  const searchParams = useSearchParams()
  const requestedCompanyId = searchParams.get('companyId')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<RankedCompany[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadCompanies = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/companies/ranking', { cache: 'no-store' })
      const data = (await response.json()) as RankingResponse
      if (!response.ok) throw new Error('Erreur API')
      setCompanies(data.ranked || [])
      if (!selectedCompanyId && data.ranked?.length) {
        setSelectedCompanyId(data.ranked[0].id)
      }
    } catch {
      setError('Impossible de charger les compagnies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (!requestedCompanyId || companies.length === 0) return
    const exists = companies.some((company) => company.id === requestedCompanyId)
    if (exists) {
      setSelectedCompanyId(requestedCompanyId)
    }
  }, [requestedCompanyId, companies])

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  )

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompanyId) return

    setSavingReview(true)
    setMessage(null)
    try {
      const response = await fetch('/api/companies/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          rating,
          comment,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: 'error', text: data?.error || 'Impossible d’enregistrer votre note.' })
        return
      }
      setMessage({ type: 'success', text: 'Votre note a ete enregistree.' })
      setComment('')
      await loadCompanies()
    } catch {
      setMessage({ type: 'error', text: 'Erreur technique lors de l’enregistrement.' })
    } finally {
      setSavingReview(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Avis</p>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Noter une compagnie</h1>
          <p className="text-sm text-gray-600 mb-6">
            Vous pouvez noter une compagnie si vous avez deja un billet confirme ou termine avec elle.
          </p>

          {loading ? (
            <div className="text-sm text-gray-600">Chargement des compagnies...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          ) : (
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (1 a 5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {selectedCompany && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span>Note actuelle :</span>
                  <RatingBadge value={selectedCompany.avgRating} variant="average" size="md" />
                </div>
              )}

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingReview}
                className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {savingReview ? 'Enregistrement...' : 'Enregistrer ma note'}
              </button>
            </form>
          )}
        </div>
    </div>
  )
}
