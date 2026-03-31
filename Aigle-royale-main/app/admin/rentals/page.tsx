import { RentalManagement } from '@/components/admin/RentalManagement'
import Link from 'next/link'

export default async function AdminRentalsPage() {
    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Locations de Bus</h1>
                    <p className="text-gray-600">Gérer les demandes de location, attribuer des cars et valider les prix.</p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour admin
                </Link>
            </div>

            <RentalManagement />
        </>
    )
}
