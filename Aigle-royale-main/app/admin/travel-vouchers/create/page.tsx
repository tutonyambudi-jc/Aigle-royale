'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type AdminRoute = {
  id: string
  origin: string
  destination: string
}

type AdminTrip = {
  id: string
  routeId: string
  departureTime: string
  route?: {
    origin?: string
    destination?: string
  }
}

export default function CreateTravelVoucherPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routes, setRoutes] = useState<AdminRoute[]>([])
  const [trips, setTrips] = useState<AdminTrip[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState(searchParams.get('routeId') || '')
  const [selectedTripId, setSelectedTripId] = useState(searchParams.get('tripId') || '')

  const defaultTitle = searchParams.get('title') || ''
  const defaultBeneficiaryName = searchParams.get('beneficiaryName') || ''
  const defaultBeneficiaryPhone = searchParams.get('beneficiaryPhone') || ''
  const defaultBeneficiaryEmail = searchParams.get('beneficiaryEmail') || ''
  const defaultValueAmount = searchParams.get('valueAmount') || ''
  const defaultPassengerCount = searchParams.get('passengerCount') || '1'
  const defaultValidUntil = searchParams.get('validUntil') || ''
  const defaultNotes = searchParams.get('notes') || ''

  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      try {
        const [routesRes, tripsRes] = await Promise.all([
          fetch('/api/admin/routes', { cache: 'no-store' }),
          fetch('/api/admin/trips', { cache: 'no-store' }),
        ])
        if (!routesRes.ok || !tripsRes.ok) throw new Error('Impossible de charger routes/trajets')
        const routesJson = await routesRes.json()
        const tripsJson = await tripsRes.json()
        if (!cancelled) {
          setRoutes(Array.isArray(routesJson) ? routesJson : [])
          setTrips(Array.isArray(tripsJson) ? tripsJson : [])
        }
      } catch {
        if (!cancelled) setError('Impossible de charger les données de référence.')
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredTrips = useMemo(() => {
    if (!selectedRouteId) return trips
    return trips.filter((trip) => trip.routeId === selectedRouteId)
  }, [trips, selectedRouteId])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        title: String(formData.get('title') || '').trim(),
        beneficiaryName: String(formData.get('beneficiaryName') || '').trim(),
        beneficiaryPhone: String(formData.get('beneficiaryPhone') || '').trim(),
        beneficiaryEmail: String(formData.get('beneficiaryEmail') || '').trim(),
        valueAmount: Number(formData.get('valueAmount') || 0),
        passengerCount: Number(formData.get('passengerCount') || 1),
        validUntil: String(formData.get('validUntil') || '').trim(),
        notes: String(formData.get('notes') || '').trim(),
        routeId: String(formData.get('routeId') || '').trim(),
        tripId: String(formData.get('tripId') || '').trim(),
        issueNow: String(formData.get('issueNow') || 'true') !== 'false',
      }

      const res = await fetch('/api/admin/travel-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erreur de création')
      router.push('/admin/travel-vouchers')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de création')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un bon de voyage</h1>
          <p className="text-gray-600">Émission d&apos;un bon pour un client ou un trajet spécifique</p>
        </div>
        <Link
          href="/admin/travel-vouchers"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
        >
          ← Retour
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <form action={handleSubmit} className="space-y-6">
            {error ? <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div> : null}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom bénéficiaire *</label>
                <input
                  type="text"
                  name="beneficiaryName"
                  required
                  defaultValue={defaultBeneficiaryName}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FC) *</label>
                <input
                  type="number"
                  name="valueAmount"
                  min="0"
                  step="1"
                  required
                  defaultValue={defaultValueAmount}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  name="beneficiaryPhone"
                  defaultValue={defaultBeneficiaryPhone}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="beneficiaryEmail"
                  defaultValue={defaultBeneficiaryEmail}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Bon commercial, geste client..."
                  defaultValue={defaultTitle}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nb passagers</label>
                <input
                  type="number"
                  name="passengerCount"
                  min="1"
                  defaultValue={defaultPassengerCount}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valide jusqu&apos;au</label>
                <input
                  type="date"
                  name="validUntil"
                  defaultValue={defaultValidUntil}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ligne (optionnel)</label>
                <select
                  name="routeId"
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value)
                    setSelectedTripId('')
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Aucune (bon global)</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.origin} - {route.destination}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trajet (optionnel)</label>
                <select
                  name="tripId"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Aucun</option>
                  {filteredTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {new Date(trip.departureTime).toLocaleString('fr-FR')} - {trip.route?.origin || 'N/A'} - {trip.route?.destination || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={defaultNotes}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut à la création</label>
              <select
                name="issueNow"
                defaultValue="true"
                className="w-full md:w-80 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="true">Émettre maintenant (ISSUED)</option>
                <option value="false">Brouillon (DRAFT)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer le bon de voyage'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
