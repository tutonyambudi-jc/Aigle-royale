import { prisma } from '@/lib/prisma'
import { PassengerManifestManager } from '@/components/admin/PassengerManifestManager'
import Link from 'next/link'

export default async function AdminManifestsPage() {
    // Charger les données nécessaires pour les filtres
    const [companies, buses] = await Promise.all([
        prisma.busCompany.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.bus.findMany({
            select: { id: true, name: true, plateNumber: true, company: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' },
        }),
    ])

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manifest passagers</h1>
                    <p className="text-gray-600">Générer et télécharger les listes de passagers.</p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour admin
                </Link>
            </div>

            <PassengerManifestManager companies={companies} buses={buses} />
        </>
    )
}
