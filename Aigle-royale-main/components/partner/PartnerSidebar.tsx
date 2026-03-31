'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const MENU_ITEMS = [
  {
    title: 'Tableau de bord',
    href: '/partner',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
]

export function PartnerSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => (href === '/partner' ? pathname === '/partner' : pathname.startsWith(href))

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-gray-900 text-gray-300
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen overflow-hidden
      `}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">PR</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">Partenaire</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-1">Lecture seule</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200
                  ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                {item.icon}
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-950/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
              <span className="text-sm font-bold text-indigo-400">{session?.user?.name?.charAt(0) || 'P'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate lowercase">{session?.user?.role}</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-red-900/40 hover:text-red-400 text-sm font-bold transition-all border border-gray-700"
          >
            Déconnexion
          </Link>
        </div>
      </aside>
    </>
  )
}
