import { FreightAdminManager } from '@/components/admin/FreightAdminManager'
import Link from 'next/link'

export default async function AdminFreightPage() {
    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Colis</h1>
                    <p className="text-gray-600">
                        Suivi complet de tous les colis enregistrés, paiements et expéditions.
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour admin
                </Link>
            </div>

            <FreightAdminManager />
        </>
    )
}
