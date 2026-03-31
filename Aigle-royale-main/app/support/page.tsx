import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { getSupportPublicConfig, buildWhatsAppUrl } from '@/lib/support-config'
import { MessageCircle, LifeBuoy, AlertTriangle, ChevronRight } from 'lucide-react'

export default async function SupportHubPage() {
  const config = await getSupportPublicConfig()
  const waUrl = buildWhatsAppUrl(config.whatsappNumber, config.whatsappPrefill)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Support & assistance</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une question sur votre réservation, un problème de paiement ou une réclamation ? Choisissez le canal qui vous convient.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/support/assistance"
            className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <LifeBuoy className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assistance</h2>
            <p className="text-sm text-gray-600 mb-4">
              Guides rapides, FAQ et conseils avant de voyager.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
              Consulter <ChevronRight className="w-4 h-4" />
            </span>
          </Link>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Chat WhatsApp</h2>
              <p className="text-sm text-gray-600 mb-4">
                Échangez directement avec notre équipe sur WhatsApp (horaires habituels).
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                Ouvrir WhatsApp <ChevronRight className="w-4 h-4" />
              </span>
            </a>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Chat WhatsApp</h2>
              <p className="text-sm text-gray-500">
                Le numéro WhatsApp sera affiché dès qu’il sera configuré par l’administrateur.
              </p>
            </div>
          )}

          <Link
            href="/support/complaints/new"
            className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Plainte / réclamation</h2>
            <p className="text-sm text-gray-600 mb-4">
              Déposez un ticket traçable avec une référence (ex. P-XXXX). Suivi par notre équipe.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800">
              Déposer une plainte <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Besoin d’un contact classique ?{' '}
          <Link href="/contact" className="text-primary-600 font-semibold hover:underline">
            Page Contact
          </Link>
        </p>
      </main>
    </div>
  )
}
