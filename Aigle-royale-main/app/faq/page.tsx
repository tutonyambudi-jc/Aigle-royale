'use client'

import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
}

const faqCategories = {
  reservation: [
    {
      question: "Comment réserver un billet en ligne ?",
      answer: "Pour réserver un billet, rendez-vous sur notre page d'accueil, sélectionnez votre ville de départ, votre destination et la date de voyage. Choisissez ensuite votre siège et complétez vos informations. Vous pouvez payer en ligne ou en agence."
    },
    {
      question: "Puis-je modifier ou annuler ma réservation ?",
      answer: "Oui, vous pouvez modifier ou annuler votre réservation jusqu'à 2 heures avant le départ. Les frais d'annulation varient selon le délai. Connectez-vous à votre compte pour gérer vos réservations."
    },
    {
      question: "Quels sont les modes de paiement acceptés ?",
      answer: "Nous acceptons le paiement par Mobile Money (Orange Money, MTN Mobile Money), carte bancaire (Visa, Mastercard) et paiement en espèces dans nos agences."
    },
    {
      question: "Dois-je imprimer mon billet ?",
      answer: "Non, ce n'est pas nécessaire. Vous pouvez présenter votre billet électronique sur votre téléphone. Le QR code sera scanné à l'embarquement."
    },
    {
      question: "Puis-je réserver pour quelqu'un d'autre ?",
      answer: "Oui, lors de la réservation, vous pouvez indiquer les informations du passager. Assurez-vous que le nom correspond à une pièce d'identité valide."
    }
  ],
  voyage: [
    {
      question: "Quels bagages puis-je emporter ?",
      answer: "Chaque passager peut emporter un bagage à main (max 5kg) et un bagage en soute (max 20kg). Les bagages supplémentaires sont facturés à 2000 FC par kg."
    },
    {
      question: "Y a-t-il des repas à bord ?",
      answer: "Des snacks et boissons sont disponibles à bord. Vous pouvez également précommander un repas complet lors de la réservation pour 3000 FC."
    },
    {
      question: "Le Wi-Fi est-il disponible dans les bus ?",
      answer: "Oui, tous nos bus sont équipés du Wi-Fi gratuit. La connexion peut varier selon la zone géographique."
    },
    {
      question: "Puis-je voyager avec des animaux ?",
      answer: "Les animaux de compagnie ne sont pas autorisés dans les bus, sauf les chiens d'aveugle qui sont acceptés gratuitement."
    },
    {
      question: "Que faire en cas de retard ?",
      answer: "En cas de retard de plus de 30 minutes non justifié, nous vous offrons un voyage gratuit. Contactez notre service client pour plus d'informations."
    }
  ],
  fret: [
    {
      question: "Comment envoyer un colis ?",
      answer: "Vous pouvez créer une commande de fret en ligne en sélectionnant un trajet, puis remplir les informations de l'expéditeur et du destinataire. Le colis sera transporté avec le bus sélectionné."
    },
    {
      question: "Quels sont les tarifs pour le transport de colis ?",
      answer: "Le tarif est de 1000 FC par kilogramme. Les colis de plus de 50kg nécessitent un devis spécial. La valeur déclarée est optionnelle mais recommandée."
    },
    {
      question: "Comment suivre mon colis ?",
      answer: "Vous recevrez un code de suivi unique lors de la création de la commande. Utilisez ce code sur notre site pour suivre l'état de votre colis en temps réel."
    },
    {
      question: "Quels objets sont interdits ?",
      answer: "Les objets dangereux, explosifs, inflammables, armes, drogues et produits périssables sont strictement interdits. Consultez notre liste complète des objets interdits."
    },
    {
      question: "Quand mon colis sera-t-il livré ?",
      answer: "Le colis arrive généralement le même jour que le bus, selon l'horaire d'arrivée du trajet. Le destinataire sera contacté pour récupérer le colis à l'arrivée."
    }
  ],
  general: [
    {
      question: "Où sont situées vos agences ?",
      answer: "Nous avons des agences dans toutes les grandes villes de Côte d'Ivoire. Consultez notre page de contact pour trouver l'agence la plus proche de chez vous."
    },
    {
      question: "Proposez-vous des réductions ?",
      answer: "Oui, nous offrons des réductions de 10% pour les étudiants (sur présentation de la carte) et 15% pour les seniors (65 ans et plus). Des promotions sont également disponibles régulièrement."
    },
    {
      question: "Comment devenir agent agréé ?",
      answer: "Pour devenir agent agréé, vous devez remplir un formulaire de candidature, fournir les documents requis et suivre une formation. Contactez-nous pour plus d'informations."
    },
    {
      question: "Vos bus sont-ils accessibles aux personnes à mobilité réduite ?",
      answer: "Oui, certains de nos bus sont équipés pour accueillir les personnes à mobilité réduite. Contactez-nous à l'avance pour réserver un bus adapté."
    },
    {
      question: "Comment contacter le service client ?",
      answer: "Vous pouvez nous contacter par téléphone au +225 XX XX XX XX, par email à support@aigleroyale.com, ou via le formulaire de contact sur notre site. Notre service est disponible 24/7."
    }
  ]
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof faqCategories>('reservation')
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Questions Fréquentes</h1>
            <p className="text-xl text-gray-600">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {Object.keys(faqCategories).map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category as keyof typeof faqCategories)
                  setOpenItems([])
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category === 'reservation' && 'Réservation'}
                {category === 'voyage' && 'Voyage'}
                {category === 'fret' && 'Transport de colis'}
                {category === 'general' && 'Général'}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqCategories[activeCategory].map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems.includes(index) ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-gray-600 mb-6">
              Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Aigle Royale</h3>
              <p className="text-gray-400">Votre compagnie de transport de confiance</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/loyalty" className="hover:text-white">Fidélité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/trips/search" className="hover:text-white">Réservation</Link></li>
                <li><Link href="/freight" className="hover:text-white">Transport de colis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">Email: contact@aigleroyale.com</p>
              <p className="text-gray-400">Tél: +225 XX XX XX XX</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Aigle Royale. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
