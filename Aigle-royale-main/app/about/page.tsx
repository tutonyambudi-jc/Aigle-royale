import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              À propos de nous
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Aigle Royale
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              Votre partenaire de confiance
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Depuis 2003, nous connectons les villes et les communautés avec des services de transport fiables, sécurisés et confortables.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-extrabold text-primary-600 mb-2">20+</div>
            <div className="text-gray-600 font-medium">Années d'expérience</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-extrabold text-primary-600 mb-2">100+</div>
            <div className="text-gray-600 font-medium">Véhicules modernes</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-extrabold text-primary-600 mb-2">50+</div>
            <div className="text-gray-600 font-medium">Destinations</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-extrabold text-primary-600 mb-2">2M+</div>
            <div className="text-gray-600 font-medium">Passagers satisfaits</div>
          </div>
        </div>

        {/* Notre Histoire */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Notre Histoire</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Fondée en 2003, <strong className="text-gray-900">Aigle Royale</strong> est née d'une vision simple : 
                  rendre le transport accessible, sûr et confortable pour tous. Ce qui a commencé comme une petite flotte 
                  de bus locaux est rapidement devenu l'une des compagnies de transport les plus respectées du pays.
                </p>
                <p>
                  Au fil des années, nous avons élargi notre réseau pour couvrir plus de 50 destinations à travers le pays, 
                  tout en maintenant notre engagement envers l'excellence du service et la satisfaction client.
                </p>
                <p>
                  Aujourd'hui, nous sommes fiers de transporter plus de 2 millions de passagers chaque année, avec une 
                  flotte moderne de plus de 100 véhicules équipés des dernières technologies de sécurité et de confort.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-12 text-white shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">2003</h3>
                      <p className="text-white/90">Création de l'entreprise avec 5 bus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">2010</h3>
                      <p className="text-white/90">Expansion à 25 destinations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">2018</h3>
                      <p className="text-white/90">1 million de passagers transportés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">2024</h3>
                      <p className="text-white/90">Lancement de la plateforme digitale</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos Valeurs */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Nos Valeurs</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident chaque décision et chaque interaction
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sécurité</h3>
              <p className="text-gray-600 leading-relaxed">
                La sécurité de nos passagers est notre priorité absolue. Tous nos véhicules sont régulièrement inspectés 
                et nos conducteurs sont formés aux meilleures pratiques de sécurité routière.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Confort</h3>
              <p className="text-gray-600 leading-relaxed">
                Nous investissons continuellement dans le confort de nos passagers avec des sièges ergonomiques, 
                la climatisation, le Wi-Fi gratuit et des espaces de rangement optimisés.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ponctualité</h3>
              <p className="text-gray-600 leading-relaxed">
                Nous comprenons que votre temps est précieux. C'est pourquoi nous nous engageons à respecter nos horaires 
                et à vous tenir informé en cas de retard exceptionnel.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Service Client</h3>
              <p className="text-gray-600 leading-relaxed">
                Notre équipe dévouée est disponible 24/7 pour répondre à vos questions et résoudre tout problème. 
                Votre satisfaction est notre priorité.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Fiabilité</h3>
              <p className="text-gray-600 leading-relaxed">
                Depuis plus de 20 ans, nous avons construit une réputation de fiabilité. Vous pouvez compter sur nous 
                pour vous transporter en toute sécurité, à temps, et dans le confort.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Engagement</h3>
              <p className="text-gray-600 leading-relaxed">
                Nous nous engageons à améliorer continuellement nos services et à innover pour offrir la meilleure 
                expérience de voyage possible à nos passagers.
              </p>
            </div>
          </div>
        </section>

        {/* Notre Mission */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl shadow-2xl p-12 md:p-16 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Notre Mission</h2>
              <p className="text-xl md:text-2xl leading-relaxed text-white/90 mb-8">
                Connecter les communautés, faciliter les déplacements et créer des expériences de voyage mémorables 
                tout en respectant les plus hauts standards de sécurité, de confort et de service.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold mb-2">100%</div>
                  <div className="text-white/90">Satisfaction client</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-white/90">Support disponible</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold mb-2">0</div>
                  <div className="text-white/90">Accidents majeurs</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi Nous Choisir */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Pourquoi Choisir Aigle Royale ?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des avantages qui font la différence
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Réservation en ligne facile</h3>
                  <p className="text-gray-600">
                    Réservez votre billet en quelques clics depuis votre smartphone, tablette ou ordinateur. 
                    Simple, rapide et sécurisé.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Véhicules modernes et sécurisés</h3>
                  <p className="text-gray-600">
                    Notre flotte est régulièrement renouvelée avec les dernières technologies de sécurité 
                    et de confort pour votre tranquillité d'esprit.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Tarifs compétitifs</h3>
                  <p className="text-gray-600">
                    Des prix transparents et compétitifs sans frais cachés. Paiement sécurisé par Mobile Money, 
                    carte bancaire ou en agence.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Service de transport de colis</h3>
                  <p className="text-gray-600">
                    Envoyez vos colis en toute sécurité avec notre service de fret. Suivi en temps réel 
                    et livraison garantie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-3xl p-12 shadow-xl">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Prêt à voyager avec nous ?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Réservez votre billet dès maintenant et découvrez pourquoi des millions de passagers nous font confiance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/trips/search"
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Réserver un billet
              </Link>
              <Link
                href="/contact"
                className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all duration-200"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Aigle Royale</h3>
              <p className="text-gray-400 leading-relaxed">
                Votre compagnie de transport de confiance depuis 2003. Connectons les villes, 
                facilitons les déplacements.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Liens utiles</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/loyalty" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    Fidélité
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    Publicité
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Services</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/trips/search" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    Réservation de billets
                  </Link>
                </li>
                <li>
                  <Link href="/freight" className="hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    Transport de colis
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@aigleroyale.com
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +225 XX XX XX XX
                </li>
              </ul>
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
