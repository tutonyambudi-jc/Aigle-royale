import Link from 'next/link'
import { SearchForm } from '@/components/client/SearchForm'
import { AdvertisementBanner } from '@/components/advertisements/AdvertisementBanner'
import { BaggageCalculator } from '@/components/client/BaggageCalculator'
import { Navigation } from '@/components/layout/Navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <Navigation />

      <main>
      {/* Hero Section with Bus Background */}

        {/* Bus Background Image Section */}
        <div className="relative min-h-[600px] lg:min-h-[700px] bg-gray-900 overflow-hidden">
          {/* Background Image avec pattern de bus */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: `url('/images/hero-coach.jpg')`,
            }}
          >
            {/* Rich Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80"></div>
          </div>

          {/* Hero Content Container */}
          <div className="relative z-10 container mx-auto px-4 py-16 lg:py-20">
            {/* Hero Text */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
                Voyagez en <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Excellence</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-200/90 font-light max-w-2xl mx-auto">
                Confort premium · Sécurité absolue · Service irréprochable
              </p>
            </div>

            {/* Search Form Card */}
            <div id="search" className="max-w-5xl mx-auto">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
                <SearchForm />
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-12"></div>

        {/* Results Section */}

        {/* Advertisement Banner */}
        <div className="max-w-5xl mx-auto mb-24 relative z-20">
          <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <AdvertisementBanner
              type="BANNER_HOMEPAGE"
              reserveHeight
              showPlaceholder
              heightClassName="h-48"
            />
          </div>
        </div>

        {/* Meilleurs tarifs */}
        <div className="max-w-6xl mx-auto mb-24 px-4 relative z-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nos Offres Exclusives</h2>
            <div className="w-20 h-1.5 bg-amber-500 mx-auto rounded-full"></div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              Profitez de tarifs avantageux sans compromis sur la qualité.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAIRE</div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-primary-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-sm font-bold text-primary-600 tracking-wider uppercase mb-2">Standard</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-extrabold text-gray-900">5 000</span>
                <span className="text-xl text-gray-500 font-medium ml-1">FC</span>
              </div>
              <p className="text-gray-600 mb-6">Voyagez confortablement sur nos lignes principales à prix mini.</p>
              <Link href="/trips/search" className="block w-full py-3 rounded-xl bg-gray-50 text-primary-700 font-bold text-center hover:bg-primary-600 hover:text-white transition-colors">Réserver</Link>
            </div>

            <div className="group bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 to-amber-600"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div className="text-sm font-bold text-amber-500 tracking-wider uppercase mb-2">Premium</div>
                <div className="flex items-baseline mb-4 text-white">
                  <span className="text-4xl font-extrabold">VIP</span>
                </div>
                <p className="text-gray-400 mb-6">Salons privés, snacks inclus, sièges extra-larges et Wi-Fi haut débit.</p>
                <Link href="/trips/search?class=vip" className="block w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-center hover:shadow-lg hover:shadow-amber-500/25 transition-all">Voir les offres VIP</Link>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="text-sm font-bold text-green-600 tracking-wider uppercase mb-2">Parrainage</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-extrabold text-gray-900">+500</span>
                <span className="text-xl text-gray-500 font-medium ml-1">FC <span className="text-xs">/ami</span></span>
              </div>
              <p className="text-gray-600 mb-6">Gagnez des crédits de voyage pour chaque ami invité.</p>
              <Link href="/referral" className="block w-full py-3 rounded-xl bg-gray-50 text-green-700 font-bold text-center hover:bg-green-600 hover:text-white transition-colors">Inviter un ami</Link>
            </div>
          </div>
        </div>

        {/* Baggage Section */}
        <div className="py-12 bg-white/50 backdrop-blur-sm border-y border-gray-100 mb-24">
          <BaggageCalculator />
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-24 px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">L'expérience Aigle Royale</h2>
            <div className="w-20 h-1.5 bg-primary-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "Réservation Simple", desc: "Interface fluide et rapide.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-500", bg: "bg-blue-50" },
              { title: "Paiement Sécurisé", desc: "Mobile Money & Carte Bancaire.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "text-green-500", bg: "bg-green-50" },
              { title: "Service Colis", desc: "Suivi en temps réel de vos envois.", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "text-purple-500", bg: "bg-purple-50" }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className={`w-20 h-20 ${f.bg} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <svg className={`w-10 h-10 ${f.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">AR</span>
                </div>
                <h3 className="text-xl font-bold">Aigle Royale</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">Votre compagnie de transport de confiance depuis 2003</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Liens utiles</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  À propos
                </Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Contact
                </Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  FAQ
                </Link></li>
                <li><Link href="/partners" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Partenaires
                </Link></li>
                <li><Link href="/loyalty" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Fidélité
                </Link></li>
                <li><Link href="/advertise" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Publicité
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Services</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/trips/search" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Nos trajets
                </Link></li>
                <li><Link href="/freight" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Transport de colis
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@aigleroyale.com
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +225 XX XX XX XX
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 mt-8 text-center">
            <p className="text-gray-400">&copy; 2024 Aigle Royale. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
