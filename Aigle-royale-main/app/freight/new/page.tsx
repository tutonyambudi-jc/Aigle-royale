'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FreightForm } from '@/components/freight/FreightForm'

export default function NewFreightPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Envoyer un colis</h1>
          <FreightForm onSuccess={(orderId) => router.push(`/freight/${orderId}`)} />
        </div>
      </div>
    </div>
  )
}
