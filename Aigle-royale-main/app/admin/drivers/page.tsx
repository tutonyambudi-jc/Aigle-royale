import { DriversManager } from '@/components/admin/DriversManager'
import Link from 'next/link'

export default async function AdminDriversPage() {
  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gérer les chauffeurs</h1>
          <p className="text-gray-600">Affectation des chauffeurs aux bus.</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
        >
          ← Retour
        </Link>
      </div>
      <DriversManager />
    </>
  )
}
