// ... imports will be updated via complete file replacement or targeted edits if possible. 
// Actually I will replace the whole component content to be safe and clean.

'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CurrencySelector } from '@/components/CurrencySelector'
import {
  Home, Info, Map, Clock, Phone, Ticket,
  Briefcase, Truck, Shield, User, LogOut,
  Menu, X, ChevronDown, Search, Percent, Heart, LifeBuoy
} from 'lucide-react'

interface NavigationProps {
  hideLinks?: boolean
}

export function Navigation({ hideLinks = false }: NavigationProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navLinkClass = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
    ${isActive(path)
      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
      : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
    }
  `

  const handleOrganiserClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      const el = document.getElementById('search')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm py-3'
        : 'bg-white/60 backdrop-blur-md border-b border-white/20 py-5'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">

          {/* 1. Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-50">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-black text-lg tracking-tighter">AR</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-gray-900 tracking-tight leading-none group-hover:text-primary-700 transition-colors">
                AIGLE ROYALE
              </span>
              <span className="text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase">
                Transport Premium
              </span>
            </div>
          </Link>

          {/* 2. Navigation Desktop (Centrée) */}
          {!hideLinks && (
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              <Link href="/" className={navLinkClass('/')}>
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </Link>

              {/* Dropdown Organiser */}
              <div className="relative group">
                <Link
                  href="/#search"
                  onClick={handleOrganiserClick}
                  className={navLinkClass('/horaires') + ' cursor-pointer group-hover:bg-white'}
                >
                  <Search className="w-4 h-4" />
                  <span>Organiser</span>
                  <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform" />
                </Link>

                <div className="absolute top-full left-0 pt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2">
                    <Link href="/horaires" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span>Horaires de bus</span>
                    </Link>
                    <Link href="/carte" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
                      <Map className="w-4 h-4 text-amber-500" />
                      <span>Carte interactive</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Dropdown Services */}
              <div className="relative group">
                <Link href="/services" className={navLinkClass('/services') + ' group-hover:bg-white'}>
                  <Ticket className="w-4 h-4" />
                  <span>Services</span>
                  <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform" />
                </Link>

                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2">
                    <Link href="/services" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><Ticket className="w-4 h-4" /></div>
                      <div>
                        <div className="text-gray-900">Tous les services</div>
                        <div className="text-[10px] text-gray-500 font-normal">Découvrez nos offres</div>
                      </div>
                    </Link>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <Link href="/services/a-bord" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Services à bord
                    </Link>
                    <Link href="/services/mobilite-reduite" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Mobilité réduite
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/reservations" className={navLinkClass('/reservations')}>
                <Briefcase className="w-4 h-4" />
                <span>Mes Réservations</span>
              </Link>

              <Link href="/companies/ranking" className={navLinkClass('/companies')}>
                <span className="text-sm">🏆</span>
                <span>Classement</span>
              </Link>

              <Link href="/support" className={navLinkClass('/support')}>
                <LifeBuoy className="w-4 h-4" />
                <span>Support</span>
              </Link>

              <Link href="/contact" className={navLinkClass('/contact')}>
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </Link>
            </nav>
          )}

          {/* 3. Actions Droite */}
          <div className="flex items-center gap-2 lg:gap-4 relative z-50">
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>

            {/* Menu Espace Pro (Visible si non connecté ou rôle pro) */}
            {(!session || ['AGENT', 'SUPER_AGENT', 'LOGISTICS', 'ADMINISTRATOR'].includes(session.user.role)) && (
              <div className="relative group hidden lg:block">
                <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                  <Briefcase className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full pt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2">
                    <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Espace Pro</div>

                    {session?.user.role === 'AGENT' || session?.user.role === 'SUPER_AGENT' || !session ? (
                      <Link href={session ? "/agent" : "/auth/login?role=agent"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4 text-green-600" />
                        <span>Espace Agent</span>
                      </Link>
                    ) : null}

                    {session?.user.role === 'SUPER_AGENT' || !session ? (
                      <Link href={session ? "/super-agent" : "/auth/login?role=agent"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Espace Super Agent</span>
                      </Link>
                    ) : null}

                    {session?.user.role === 'LOGISTICS' || session?.user.role === 'SUPER_AGENT' || !session ? (
                      <Link href={session ? "/logistics" : "/auth/login?role=logistics"} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <Truck className="w-4 h-4 text-orange-600" />
                        <span>Logistique</span>
                      </Link>
                    ) : null}

                    {session?.user.role === 'ADMINISTRATOR' && (
                      <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4 text-red-600" />
                        <span>Administration</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Auth Buttons */}
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-300 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {session.user.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                <div className="absolute right-0 top-full pt-2 w-64 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-bold text-gray-900">{session.user.name}</div>
                      <div className="text-xs text-gray-500">{session.user.email}</div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium">
                        <User className="w-4 h-4" /> Mon Profil
                      </Link>
                      <Link href="/loyalty" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium">
                        <Heart className="w-4 h-4 text-rose-500" /> Fidélité
                      </Link>
                      <Link href="/referral" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 font-medium">
                        <Percent className="w-4 h-4 text-green-500" /> Parrainage
                      </Link>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-sm text-red-600 font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:flex px-5 py-2.5 rounded-full text-sm font-bold text-gray-700 hover:text-primary-700 hover:bg-primary-50 transition-all"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 hover:bg-gray-800 transition-all"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white lg:hidden overflow-y-auto animate-in slide-in-from-top-10 fade-in duration-200">
          <div className="p-4 space-y-6 mt-20">
            {!hideLinks && (
              <nav className="space-y-2">
                <Link onClick={() => setMobileOpen(false)} href="/" className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-50 text-lg font-semibold text-gray-900">
                  <Home className="w-5 h-5 text-gray-500" /> Accueil
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/#search" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <Search className="w-5 h-5 text-gray-500" /> Organiser un voyage
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/reservations" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <Briefcase className="w-5 h-5 text-gray-500" /> Mes Réservations
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/services" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <Ticket className="w-5 h-5 text-gray-500" /> Services
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/companies/ranking" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <span className="w-5 h-5 text-center">🏆</span> Classement compagnies
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/support" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <LifeBuoy className="w-5 h-5 text-gray-500" /> Support
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/contact" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-gray-600 hover:bg-gray-50">
                  <Phone className="w-5 h-5 text-gray-500" /> Contact
                </Link>
              </nav>
            )}

            <div className="border-t border-gray-100 pt-6">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Espace Professionnel</div>
              <div className="grid grid-cols-2 gap-3">
                <Link onClick={() => setMobileOpen(false)} href="/agent" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-green-50 text-green-700 font-semibold gap-2">
                  <User className="w-6 h-6" /> Agent
                </Link>
                <Link onClick={() => setMobileOpen(false)} href="/logistics" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 text-orange-700 font-semibold gap-2">
                  <Truck className="w-6 h-6" /> Logistique
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

