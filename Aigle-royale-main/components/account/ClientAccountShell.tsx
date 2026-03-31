'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Ticket,
  Compass,
  User,
  Gift,
  Share2,
  Star,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Headphones,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  match: (pathname: string) => boolean
  cta?: boolean
}

const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    match: (p) => p === '/dashboard',
  },
  {
    href: '/reservations',
    label: 'Mes billets',
    icon: Ticket,
    match: (p) => p === '/reservations' || p.startsWith('/reservations/'),
  },
  {
    href: '/trips/search',
    label: 'Réserver un trajet',
    icon: Compass,
    match: () => false,
    cta: true,
  },
  { href: '/profile', label: 'Mon profil', icon: User, match: (p) => p.startsWith('/profile') },
  { href: '/loyalty', label: 'Fidélité', icon: Gift, match: (p) => p.startsWith('/loyalty') },
  { href: '/referral', label: 'Parrainage', icon: Share2, match: (p) => p.startsWith('/referral') },
  {
    href: '/dashboard/reviews',
    label: 'Mes avis',
    icon: Star,
    match: (p) => p.startsWith('/dashboard/reviews'),
  },
  {
    href: '/dashboard/notifications',
    label: 'Notifications',
    icon: Bell,
    match: (p) => p.startsWith('/dashboard/notifications'),
  },
  {
    href: '/support',
    label: 'Aide & support',
    icon: Headphones,
    match: (p) => p.startsWith('/support'),
  },
]

type Props = {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export function ClientAccountShell({ children, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {NAV.map((item) => {
        const Icon = item.icon
        const active = item.match(pathname)
        if (item.cta) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold bg-primary-600 text-white shadow-md shadow-primary-900/20 hover:bg-primary-700 transition-colors"
            >
              <Icon className="shrink-0" size={18} />
              {item.label}
              <ChevronRight className="ml-auto opacity-80" size={16} />
            </Link>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white/10 text-white shadow-inner border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className={cn('shrink-0', active ? 'text-primary-400' : '')} size={18} />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen flex bg-[#e8ecf4] text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:shrink-0 bg-[#0f172a] text-slate-100 border-r border-slate-800/80 min-h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-black tracking-tight text-white group-hover:text-primary-300 transition-colors">
              Aigle Royale
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">Espace client</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(300px,88vw)] flex flex-col bg-[#0f172a] text-slate-100 shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <p className="font-black text-white">Aigle Royale</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Espace client</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </nav>
        <div className="p-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 lg:px-8 bg-[#e8ecf4]/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-sm"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compte</p>
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
            </div>
          </div>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 shrink-0"
          >
            Retour au site
            <ExternalLink size={14} />
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
