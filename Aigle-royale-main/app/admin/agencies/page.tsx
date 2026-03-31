import { AgencyDirectory } from '@/components/agent/AgencyDirectory'
import Link from 'next/link'

export default async function AdminAgenciesPage() {
    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Annuaire des Agences</h1>
                    <p className="text-gray-600">Consulter la liste de toutes les agences de voyage partenaires.</p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800 transition-colors"
                >
                    ← Retour admin
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <AgencyDirectory />
            </div>
        </>
    )
}
