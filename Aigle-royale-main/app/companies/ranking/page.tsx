'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
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
  rules: {
    recommendedMinAverage: number
    recommendedMinReviews: number
  }
}

export default function CompanyRankingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<RankedCompany[]>([])
  const [rules, setRules] = useState<RankingResponse['rules'] | null>(null)

  const loadRanking = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/companies/ranking', { cache: 'no-store' })
      const data = (await response.json()) as RankingResponse
      if (!response.ok) throw new Error('Erreur API')
      setCompanies(data.ranked || [])
      setRules(data.rules)
    } catch {
      setError('Impossible de charger le classement des compagnies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRanking()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Classement des compagnies</h1>
            <p className="text-gray-600">
              Découvrez les compagnies les mieux notées par les clients.
            </p>
            {rules && (
              <p className="text-xs text-gray-500 mt-2">
                Badge Recommandée: moyenne ≥ {rules.recommendedMinAverage} et au moins {rules.recommendedMinReviews} avis.
              </p>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-gray-600">Chargement du classement...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rang</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compagnie</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avis</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-black text-gray-700">#{company.rank}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.busesCount} bus</div>
                        </td>
                        <td className="px-5 py-4">
                          <RatingBadge value={company.avgRating} variant="average" size="sm" />
                        </td>
                        <td className="px-5 py-4 text-gray-700">{company.reviewsCount}</td>
                        <td className="px-5 py-4">
                          {company.recommended ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Recommandée
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
