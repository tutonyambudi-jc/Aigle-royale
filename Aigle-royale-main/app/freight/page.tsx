'use client'

import { Navigation } from '@/components/layout/Navigation'
import { FreightCalculator } from '@/components/freight/FreightCalculator'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FreightPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <Navigation hideLinks />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
              Transport de Luxe
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Expédition de <span className="text-primary-600">Colis</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              Aigle Royale transporte vos marchandises avec le même soin et la même exigence que nos voyageurs.
            </p>
          </div>

          {/* Informations sur le service */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-12 mb-12 border border-slate-100">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm italic">AR</span>
                  Notre Service Premium
                </h3>
                <ul className="space-y-4">
                  {[
                    "Sécurité maximale des marchandises",
                    "Départs quotidiens garantis",
                    "Suivi en temps réel simplifié",
                    "Assurance de valeur disponible"
                  ].map((item, id) => (
                    <li key={id} className="flex items-center gap-3 text-slate-600 font-medium">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs opacity-50">Grille Tarifaire Unifiée</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                    <span className="font-bold text-slate-600">Tarif au Kilo</span>
                    <span className="text-xl font-black text-primary-600">10 000 FC</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">• Enregistrement physique obligatoire</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">• Pesée certifiée en agence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Section */}
          <div id="calculator" className="scroll-mt-20 mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Estimateur de coût</h2>
              <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block"></div>
            </div>
            <FreightCalculator />
          </div>

          {/* Types de colis acceptés */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-600 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Articles Autorisés
              </h3>
              <ul className="grid grid-cols-1 gap-3 text-slate-500 font-medium text-sm">
                {['Documents confidentiels', 'Vêtements & Textiles', 'Électronique sécurisée', 'Produits secs', 'Matériel de bureau', 'Effets personnels'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-rose-600 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                Articles Proscrits
              </h3>
              <ul className="grid grid-cols-1 gap-3 text-slate-500 font-medium text-sm">
                {['Produits inflammables', 'Armes & Munitions', 'Périssables frais', 'Animaux vivants', 'Liquides corrosifs', 'Matières dangereuses'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-200"></span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-black italic tracking-tighter">AIGLE <span className="text-primary-500">ROYALE</span></h3>
              <p className="text-slate-400 text-sm leading-relaxed">Votre compagnie de transport de confiance pour tous vos voyages et expéditions à travers la sous-région.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Liens utiles</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Services</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="/trips/search" className="hover:text-white transition-colors">Réservation de billets</Link></li>
                <li><Link href="/freight" className="hover:text-white transition-colors text-white font-bold">Transport de colis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Contact</h4>
              <p className="text-slate-400 text-sm mb-2">Email: contact@aigleroyale.com</p>
              <p className="text-slate-400 text-sm font-bold">Tél: +225 00 00 00 00</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 text-center text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
            <p>&copy; 2024 Aigle Royale. Excellence en Transport.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
