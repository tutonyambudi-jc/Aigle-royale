'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { Offer } from '@prisma/client'
import { updateOffer, deleteOffer } from '@/app/admin/offers/actions'

interface EditOfferFormProps {
    offer: Offer
}

export function EditOfferForm({ offer }: EditOfferFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await updateOffer(offer.id, formData)

        if (result.success) {
            router.push('/admin/offers')
        } else {
            setError(result.error || 'Une erreur est survenue')
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;

        const result = await deleteOffer(offer.id)
        if (result.success) {
            router.push('/admin/offers')
        } else {
            setError(result.error || 'Erreur lors de la suppression')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/admin/offers" className="text-gray-500 hover:text-gray-700 inline-flex items-center">
                        ← Retour aux offres
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Supprimer l'offre
                    </button>
                </div>

                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier l'offre</h1>

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
                                    defaultValue={offer.title}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                                <textarea
                                    name="description"
                                    defaultValue={offer.description || ''}
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
                                    defaultValue={offer.code || ''}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono uppercase"
                                />
                            </div>

                            {/* Réduction */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de réduction</label>
                                    <select
                                        name="discountType"
                                        defaultValue={offer.discountType}
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
                                        defaultValue={offer.discountValue}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant Min. Achat</label>
                                    <input
                                        type="number"
                                        name="minAmount"
                                        defaultValue={offer.minAmount || ''}
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite d'utilisations</label>
                                    <input
                                        type="number"
                                        name="usageLimit"
                                        defaultValue={offer.usageLimit || ''}
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        defaultValue={offer.startDate.toISOString().split('T')[0]}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        defaultValue={offer.endDate.toISOString().split('T')[0]}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Active */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    id="isActive"
                                    defaultChecked={offer.isActive}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                    Offre active
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
