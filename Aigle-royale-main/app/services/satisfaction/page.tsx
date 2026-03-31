import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export default function SatisfactionClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Satisfaction clients</h1>
          <p className="text-gray-600">
            Votre avis est essentiel: partagez une suggestion ou signalez un problème pour améliorer notre service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Nos engagements</h2>
            <ul className="text-gray-700 space-y-2">
              <li>- Ponctualité et sécurité</li>
              <li>- Transparence des prix</li>
              <li>- Amélioration continue</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Besoin d’aide ?</h2>
            <p className="text-gray-700 mb-4">
              Pour une réclamation ou une question urgente, contactez-nous directement.
            </p>
            <Link href="/contact" className="inline-flex px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700">
              Contacter le support
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/services" className="text-primary-700 font-bold hover:underline">
            ← Retour à tous les services
          </Link>
        </div>
      </div>
    </div>
  )
}

