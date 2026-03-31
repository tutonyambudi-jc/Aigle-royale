import { MealsManager } from '@/components/admin/MealsManager'

export default async function AdminMealsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin • Repas à bord</h1>
        <p className="text-gray-600">Gestion des repas réservables.</p>
      </div>
      <MealsManager />
    </>
  )
}
