import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export default function MobiliteReduitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Mobilité réduite</h1>
          <p className="text-gray-600">Informations et conseils pour organiser votre voyage en toute sérénité.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Avant le départ</h2>
            <ul className="text-gray-700 space-y-2">
              <li>- Prévoyez d’arriver plus tôt pour faciliter l’embarquement.</li>
              <li>- Informez l’agence si vous avez besoin d’assistance.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Pendant le voyage</h2>
            <ul className="text-gray-700 space-y-2">
              <li>- Le personnel peut vous guider lors des arrêts et pauses.</li>
              <li>- Conservez vos documents et objets essentiels à portée de main.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/services" className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 font-bold text-gray-800 hover:bg-gray-50">
            Tous les services
          </Link>
          <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700">
            Contacter l’assistance
          </Link>
        </div>
      </div>
    </div>
  )
}

