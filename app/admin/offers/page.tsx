import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function OffersPage() {
    const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
    })

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Offres</h1>
                    <p className="text-gray-600">Créez et gérez vos codes promo et réductions</p>
                </div>
                <Link
                    href="/admin/offers/create"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                    + Nouvelle Offre
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titre / Code</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réduction</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validité</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisations</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {offers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Aucune offre trouvée. Créez votre première offre !
                                </td>
                            </tr>
                        ) : (
                            offers.map((offer) => (
                                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{offer.title}</div>
                                        {offer.code && (
                                            <div className="text-sm font-mono text-primary-600 bg-primary-50 inline-block px-2 py-0.5 rounded mt-1 border border-primary-100">
                                                {offer.code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">
                                            {offer.discountType === 'PERCENTAGE' ? `-${offer.discountValue}%` : `-${formatCurrency(offer.discountValue, 'FC')}`}
                                        </div>
                                        {offer.minAmount && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Min. {formatCurrency(offer.minAmount, 'FC')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>Du {format(offer.startDate, 'dd/MM/yyyy', { locale: fr })}</div>
                                        <div>Au {format(offer.endDate, 'dd/MM/yyyy', { locale: fr })}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className="font-medium text-gray-900">{offer.usedCount}</span>
                                        {offer.usageLimit && <span className="text-gray-400"> / {offer.usageLimit}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${offer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {offer.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/offers/${offer.id}`}
                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                        >
                                            Modifier
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
