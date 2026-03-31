'use client'

import { usePathname } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isNoNavRoute = pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/reservations') ||
        pathname?.startsWith('/referral') ||
        pathname?.startsWith('/loyalty') ||
        pathname?.startsWith('/trips/search') ||
        pathname?.startsWith('/bookings')

    return (
        <>
            <div className={isNoNavRoute ? 'pb-0' : 'pb-16 md:pb-0'}>
                {children}
            </div>
            <MobileBottomNav />
        </>
    )
}
