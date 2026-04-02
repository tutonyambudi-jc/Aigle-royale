'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSettingsHub } from '@/components/admin/AdminSettingsHub'
import { FreightCompanyPricingForm } from '@/components/admin/FreightCompanyPricingForm'
import { SystemBookingSettingsForm } from '@/components/admin/SystemBookingSettingsForm'

const SETTINGS_HASH_ANCHORS = ['env-doc', 'cron-doc', 'freight-pricing'] as const

function useScrollToHashOnSettingsPage() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/admin/settings') return

    const scrollToAnchor = () => {
      const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
      if (!raw || !SETTINGS_HASH_ANCHORS.includes(raw as (typeof SETTINGS_HASH_ANCHORS)[number])) return
      const el = document.getElementById(raw)
      if (!el) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
    }

    scrollToAnchor()
    window.addEventListener('hashchange', scrollToAnchor)
    return () => window.removeEventListener('hashchange', scrollToAnchor)
  }, [pathname])
}

export default function SettingsPage() {
  const router = useRouter()
  useScrollToHashOnSettingsPage()

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>

        <AdminSettingsHub />

        <section aria-labelledby="booking-settings-heading" className="scroll-mt-8">
          <h2 id="booking-settings-heading" className="sr-only">
            Réservation et billetterie
          </h2>
          <SystemBookingSettingsForm />
        </section>

        <section aria-labelledby="freight-pricing-heading" className="scroll-mt-8">
          <h2 id="freight-pricing-heading" className="sr-only">
            Tarification fret par compagnie
          </h2>
          <FreightCompanyPricingForm />
        </section>
      </div>
    </div>
  )
}
