import { AdsManager } from '@/components/admin/AdsManager'

export default async function AdminAdvertisementsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publicités</h1>
        <p className="text-gray-600">Gérer les annonces affichées sur le frontend.</p>
      </div>
      <AdsManager />
    </>
  )
}
