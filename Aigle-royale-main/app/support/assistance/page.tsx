import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { getSupportPublicConfig, buildWhatsAppUrl } from '@/lib/support-config'
import { ChevronDown, MessageCircle } from 'lucide-react'

const FAQ = [
  {
    q: 'Comment modifier ou annuler ma réservation ?',
    a: 'Connectez-vous à votre compte, ouvrez « Mes réservations » et suivez les options disponibles selon le statut de votre billet. En cas de blocage, ouvrez une plainte avec votre numéro de ticket.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Selon les options activées sur la plateforme : Mobile Money, carte, ou paiement en agence. Le détail apparaît à l’étape paiement.',
  },
  {
    q: 'J’ai payé mais mon billet n’apparaît pas confirmé',
    a: 'Vérifiez votre boîte mail et l’historique dans « Mes réservations ». Si le délai est dépassé, contactez-nous via WhatsApp ou déposez une plainte catégorie « Paiement » avec la référence de transaction.',
  },
  {
    q: 'Comment signaler un problème à bord ou avec le personnel ?',
    a: 'Utilisez le formulaire « Plainte / réclamation » en choisissant la catégorie « Service ». Votre dossier recevra une référence pour suivi.',
  },
]

export default async function SupportAssistancePage() {
  const config = await getSupportPublicConfig()
  const waUrl = buildWhatsAppUrl(config.whatsappNumber, config.whatsappPrefill)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/support" className="text-sm font-medium text-primary-600 hover:underline mb-6 inline-block">
          ← Retour au support
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Assistance</h1>
        <p className="text-gray-600 mb-10">
          Réponses aux questions fréquentes et canaux pour vous aider rapidement.
        </p>

        <div className="space-y-3 mb-12">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group bg-white rounded-xl border border-gray-200 open:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 font-semibold text-gray-900">
                {item.q}
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        {waUrl && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-bold text-green-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> Besoin d’aide en direct ?
              </h2>
              <p className="text-sm text-green-800 mt-1">Ouvrez une conversation WhatsApp avec notre équipe.</p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center px-5 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/support/complaints/new" className="text-primary-600 font-semibold hover:underline">
            Faire une réclamation officielle →
          </Link>
        </div>
      </main>
    </div>
  )
}
