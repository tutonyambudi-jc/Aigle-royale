import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Tous les services</h1>
          <p className="text-gray-600">Découvrez nos services pour améliorer votre confort et votre expérience de voyage.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/services/a-bord" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-gray-500 mb-2">À bord</div>
            <div className="text-xl font-extrabold text-gray-900 mb-2">Services à bord</div>
            <p className="text-gray-600">Confort, bagages, pauses, sécurité, informations et conseils.</p>
          </Link>

          <Link
            href="/services/mobilite-reduite"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-sm font-semibold text-gray-500 mb-2">Accessibilité</div>
            <div className="text-xl font-extrabold text-gray-900 mb-2">Mobilité réduite</div>
            <p className="text-gray-600">Assistance et recommandations pour un voyage plus simple.</p>
          </Link>

          <Link
            href="/services/satisfaction"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-sm font-semibold text-gray-500 mb-2">Qualité</div>
            <div className="text-xl font-extrabold text-gray-900 mb-2">Satisfaction clients</div>
            <p className="text-gray-600">Réclamations, suggestions, suivi et engagements qualité.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

