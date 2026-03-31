import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { AdvertiseForm } from '@/components/advertisements/AdvertiseForm'

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Annoncez sur Aigle Royale</h1>
            <p className="text-gray-700 text-lg">
              Touchez des voyageurs au bon moment: recherche de trajet, réservation, confirmation de billet.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="text-sm font-semibold text-gray-500">Emplacement</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">Accueil</div>
              <div className="text-gray-600 mt-2">Bannière visible sur la page d’accueil.</div>
              <div className="mt-4 text-sm text-gray-700">
                <span className="font-semibold">Format:</span> 100% largeur, image.
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="text-sm font-semibold text-gray-500">Emplacement</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">Résultats</div>
              <div className="text-gray-600 mt-2">Bannière après les résultats de recherche.</div>
              <div className="mt-4 text-sm text-gray-700">
                <span className="font-semibold">Format:</span> 100% largeur, image.
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="text-sm font-semibold text-gray-500">Emplacement</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">Confirmation</div>
              <div className="text-gray-600 mt-2">Bannière sur la page de confirmation.</div>
              <div className="mt-4 text-sm text-gray-700">
                <span className="font-semibold">Format:</span> 100% largeur, image.
              </div>
            </div>
          </div>

          <AdvertiseForm />

          <div className="mt-10 text-center text-gray-600">
            Vous êtes administrateur ?{' '}
            <Link href="/admin/advertisements" className="text-primary-700 font-semibold hover:underline">
              Gérer les publicités
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

