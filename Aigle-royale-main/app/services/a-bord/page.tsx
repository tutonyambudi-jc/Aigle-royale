import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export default function ServicesABordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Services à bord</h1>
          <p className="text-gray-600">Tout ce qu’il faut savoir pour voyager confortablement avec Aigle Royale.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">Achat de repas & accès Wi‑Fi</h2>
          <p className="text-gray-700">
            Vous pouvez <span className="font-semibold">réserver un repas</span> (avec sélection du menu) et/ou{' '}
            <span className="font-semibold">acheter un pass Wi‑Fi</span> en les ajoutant à votre réservation{' '}
            <span className="text-gray-500">(avant paiement)</span>.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary-600 text-white font-extrabold hover:bg-primary-700"
            >
              Réserver un repas / Wi‑Fi
            </Link>
            <Link
              href="/#search"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-extrabold hover:bg-gray-50"
            >
              Faire une réservation
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Confort</h2>
            <ul className="text-gray-700 space-y-2">
              <li>- Sièges confortables (selon disponibilité: Standard/VIP)</li>
              <li>- Climatisation (selon bus)</li>
              <li>- Pauses sur les longs trajets</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Bagages & sécurité</h2>
            <ul className="text-gray-700 space-y-2">
              <li>- Présentez-vous à l’avance pour l’embarquement</li>
              <li>- Gardez vos objets de valeur avec vous</li>
              <li>- Respectez les consignes du personnel</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/services" className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 font-bold text-gray-800 hover:bg-gray-50">
            Tous les services
          </Link>
          <Link href="/services/satisfaction" className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700">
            Donner un avis
          </Link>
        </div>
      </div>
    </div>
  )
}

