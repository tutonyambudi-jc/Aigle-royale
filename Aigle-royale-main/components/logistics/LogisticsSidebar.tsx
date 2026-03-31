'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const MENU_ITEMS = [
    {
        title: 'Planning Chauffeurs',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        href: '/logistics',
    },
    {
        title: 'Gestion Colis',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        href: '/logistics?tab=parcels',
    },
    {
        title: 'Contentieux',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        href: '/logistics?tab=issues',
    },
]

export function LogisticsSidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const isActive = (href: string) => {
        // If it's a direct match or matches the pathname (for query params we check if pathname matches base)
        const baseHref = href.split('?')[0]
        const currentTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
        const hrefTab = new URL(href, 'http://localhost').searchParams.get('tab')

        if (pathname === baseHref) {
            if (!hrefTab && !currentTab) return true
            return hrefTab === currentTab
        }
        return false
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-lg">LOG</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">LOGISTIQUE</h1>
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Aigle Royale</p>
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
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
                            >
                                <span className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'}`}>
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
                            <span className="text-sm font-bold text-blue-400">
                                {session?.user?.name?.charAt(0) || 'L'}
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
