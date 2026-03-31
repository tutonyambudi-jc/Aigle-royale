'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const MENU_ITEMS = [
    {
        title: 'Tableau de bord',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        href: '/super-agent',
    },
    {
        title: 'Réservations',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        href: '/super-agent/bookings',
    },
    {
        title: 'Créer un ticket',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        href: '/super-agent/availability',
    },
    {
        title: 'Colis & Fret',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        href: '/super-agent/freight',
    },
]

export function SuperAgentSidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === '/super-agent') return pathname === '/super-agent'
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-gray-900 text-gray-300
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen overflow-hidden
      `}>
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-lg">SA</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">SUPER AGENT</h1>
                        <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-1">Aigle Royale</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200
                  ${active
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
                            >
                                <span className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'}`}>
                                    {item.icon}
                                </span>
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Profile */}
                <div className="p-4 border-t border-gray-800 bg-gray-950/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                            <span className="text-sm font-bold text-indigo-400">
                                {session?.user?.name?.charAt(0) || 'S'}
                            </span>
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1h-3v-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 012-2h2v-1" />
                        </svg>
                        Déconnexion
                    </Link>
                </div>
            </aside>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
        </>
    )
}
