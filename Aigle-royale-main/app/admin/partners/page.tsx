import { prisma } from '@/lib/prisma'
import { PassengerManifestManager } from '@/components/admin/PassengerManifestManager'
import Link from 'next/link'

export default async function AdminPartnersPage() {
  const [companies, buses] = await Promise.all([
    prisma.busCompany.findMany({ orderBy: { name: 'asc' } }),
    prisma.bus.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { company: true },
    }),
  ])

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partenaires & Manifestes</h1>
          <p className="text-gray-600">Partage des listes de passagers via liens sécurisés.</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
        >
          ← Retour
        </Link>
      </div>
      <PassengerManifestManager companies={companies} buses={buses} />
    </>
  )
}
