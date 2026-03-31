'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Ticket, Package, User } from 'lucide-react'

export function MobileBottomNav() {
    const pathname = usePathname()

    const navItems = [
        { label: 'Accueil', icon: Home, href: '/' },
        { label: 'Billets', icon: Ticket, href: '/reservations' },
        { label: 'Fret', icon: Package, href: '/freight' },
        { label: 'Profil', icon: User, href: '/dashboard' },
    ]

    const isActive = (href: string) => {
        if (href === '/' && pathname === '/') return true
        if (href !== '/' && pathname.startsWith(href)) return true
        return false
    }

    const isNoNavRoute = pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/reservations') ||
        pathname?.startsWith('/referral') ||
        pathname?.startsWith('/loyalty') ||
        pathname?.startsWith('/trips/search') ||
        pathname?.startsWith('/bookings')

    if (isNoNavRoute) return null

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Active = isActive(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300 ${Active ? 'text-primary-600' : 'text-gray-500'
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={`transition-transform duration-300 ${Active ? 'scale-110' : ''}`}
                                strokeWidth={Active ? 2.5 : 2}
                            />
                            <span className={`text-[10px] font-medium ${Active ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                            {Active && (
                                <div className="absolute top-0 w-8 h-1 bg-primary-600 rounded-b-full shadow-[0_2px_10px_rgba(37,99,235,0.4)]" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
