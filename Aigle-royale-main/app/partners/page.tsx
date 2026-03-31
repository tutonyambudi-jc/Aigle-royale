import { Navigation } from '@/components/layout/Navigation'
import Link from 'next/link'

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Partenaires</h1>
            <p className="text-gray-600 mb-8">
              Espace dédié aux compagnies et agences partenaires. Vous souhaitez collaborer avec Aigle Royale (vente en
              agence, intégration des lignes, reporting) ? Contactez-nous.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Pour les compagnies</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Intégrer vos bus & lignes</div>
                <p className="text-gray-600 text-sm">
                  Ajoutez vos bus, trajets, arrêts et horaires. Suivez les réservations et les ventes.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Pour les agences</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Vendre en agence</div>
                <p className="text-gray-600 text-sm">
                  Outils de vente, commissions, rapports et suivi quotidien/hebdomadaire/mensuel.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Pour le contrôle</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Manifest passagers</div>
                <p className="text-gray-600 text-sm">
                  Génération de manifest et partage sécurisé par lien (email / WhatsApp) via le back-office.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/companies/ranking"
                className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-center"
              >
                Voir le classement des compagnies
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors text-center"
              >
                Devenir partenaire
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 hover:bg-gray-50 text-center"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

