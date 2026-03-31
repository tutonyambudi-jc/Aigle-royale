'use client'

import { Navigation } from '@/components/layout/Navigation'
import { FreightTracking } from '@/components/freight/FreightTracking'

export default function FreightTrackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Suivre un colis</h1>
            <p className="text-gray-600 text-lg">Entrez votre code de suivi pour connaître l'état de votre colis</p>
          </div>

          <FreightTracking />
        </div>
      </main>
    </div>
  )
}
