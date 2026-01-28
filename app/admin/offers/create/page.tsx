'use client'

import { createOffer } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

export default function CreateOfferPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await createOffer(formData)

        if (result.success) {
            router.push('/admin/offers')
        } else {
            setError(result.error || 'Une erreur est survenue')
            setLoading(false)
        }
    }

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer une offre</h1>
                    <p className="text-gray-600">Ajouter une nouvelle promotion ou code promo.</p>
                </div>
                <Link
                    href="/admin/offers"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour
                </Link>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <form action={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'offre</label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="ex: Soldes d'été"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                            <textarea
                                name="description"
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Code Promo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code Promo (optionnel)</label>
                            <input
                                type="text"
                                name="code"
                                placeholder="ex: SUMMER24 - laisser vide pour une offre automatique"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono uppercase"
                            />
                        </div>

                        {/* Réduction */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    name="discountType"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="PERCENTAGE">Pourcentage (%)</option>
                                    <option value="FIXED_AMOUNT">Montant Fixe (FC)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                                <input
                                    type="number"
                                    name="discountValue"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Conditions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant Min.</label>
                                <input
                                    type="number"
                                    name="minAmount"
                                    min="0"
                                    placeholder="Optionnel"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                                <input
                                    type="number"
                                    name="usageLimit"
                                    min="0"
                                    placeholder="Illimité si vide"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 font-bold"
                            >
                                {loading ? 'Création...' : 'Créer l\'offre'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
