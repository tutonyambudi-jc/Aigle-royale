'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaginationControls } from './PaginationControls'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type City = {
  id: string
  name: string
  stops: CityStop[]
}

type CityStop = {
  id: string
  cityId: string
  name: string
  type: string
  address?: string | null
  city?: { id: string; name: string }
}

function pickOtherCityId(cities: { id: string }[], originId: string): string {
  return cities.find((c) => c.id !== originId)?.id ?? ''
}

type RouteStop = {
  id: string
  routeId: string
  stopId: string
  order: number
  role: string
  stop: CityStop & { city: { id: string; name: string } }
}

type Route = {
  id: string
  origin: string
  destination: string
  originCityId?: string | null
  destinationCityId?: string | null
  distance?: number | null
  duration?: number | null
  stops: RouteStop[]
}

type Bus = {
  id: string
  name: string
  plateNumber: string
  capacity: number
  company?: { name: string } | null
}

type TripStop = {
  id: string
  order: number
  dwellMinutes?: number | null
  arrivalTime?: string | null
  departureTime?: string | null
  stop: CityStop & { city: { id: string; name: string } }
}

type Trip = {
  id: string
  departureTime: string
  arrivalTime: string
  price: number
  promoActive?: boolean
  promoMode?: string | null
  promoPrice?: number | null
  promoDays?: number[] | null
  bus: Bus
  route: Route
  stopovers: TripStop[]
  boardingMinutesBefore?: number
  promotionPercentage?: number
}

export function RoutesTripsManager({
  initialCities,
  initialRoutes,
  initialBuses,
  initialTrips,
  totalTrips,
  currentPage,
  currentLimit,
}: {
  initialCities: City[]
  initialRoutes: Route[]
  initialBuses: Bus[]
  initialTrips: Trip[]
  totalTrips: number
  currentPage: number
  currentLimit: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeManagerTab, setActiveManagerTab] = useState<'cities' | 'routes' | 'trips' | 'list'>('list')

  const [isEditingCity, setIsEditingCity] = useState(false)
  const [isEditingRoute, setIsEditingRoute] = useState(false)
  const [isEditingTrip, setIsEditingTrip] = useState(false)

  // --- Cities / Stops ---
  const [newCityName, setNewCityName] = useState('')
  const [selectedCityId, setSelectedCityId] = useState(initialCities[0]?.id ?? '')
  const selectedCity = useMemo(
    () => initialCities.find((c) => c.id === selectedCityId),
    [initialCities, selectedCityId]
  )
  const [newStop, setNewStop] = useState({ name: '', type: 'BOTH', address: '' })

  // --- Routes ---
  const [newRoute, setNewRoute] = useState({
    originCityId: initialCities[0]?.id ?? '',
    destinationCityId:
      initialCities.length >= 2
        ? pickOtherCityId(initialCities, initialCities[0]?.id ?? '')
        : '',
    distance: '',
    duration: '',
  })

  // Quand les villes arrivent après refresh (ex. 2e ville créée), l’état local ne se met pas à jour seul.
  useEffect(() => {
    if (isEditingRoute) return
    setNewRoute((prev) => {
      if (initialCities.length < 2) {
        const originOk = initialCities.some((c) => c.id === prev.originCityId)
        return {
          ...prev,
          originCityId: originOk ? prev.originCityId : (initialCities[0]?.id ?? ''),
          destinationCityId: '',
        }
      }
      let originCityId = prev.originCityId
      let destinationCityId = prev.destinationCityId
      if (!initialCities.some((c) => c.id === originCityId)) {
        originCityId = initialCities[0]!.id
      }
      if (!destinationCityId || !initialCities.some((c) => c.id === destinationCityId)) {
        destinationCityId = pickOtherCityId(initialCities, originCityId)
      }
      if (originCityId === destinationCityId) {
        destinationCityId = pickOtherCityId(initialCities, originCityId)
      }
      if (originCityId === prev.originCityId && destinationCityId === prev.destinationCityId) {
        return prev
      }
      return { ...prev, originCityId, destinationCityId }
    })
  }, [initialCities, isEditingRoute])

  const [selectedRouteId, setSelectedRouteId] = useState(initialRoutes[0]?.id ?? '')
  const selectedRoute = useMemo(
    () => initialRoutes.find((r) => r.id === selectedRouteId),
    [initialRoutes, selectedRouteId]
  )
  const [routeStopToAdd, setRouteStopToAdd] = useState({
    stopId: '',
    role: 'STOP',
    notes: '',
  })

  // --- Trips / schedules ---
  const [newTrip, setNewTrip] = useState({
    busId: initialBuses[0]?.id ?? '',
    routeId: initialRoutes[0]?.id ?? '',
    departureTime: '',
    arrivalTime: '',
    price: '5000',
    boardingMinutesBefore: '30',
    promoActive: false,
    promoMode: '',
    promoPrice: '',
    promoDays: [] as number[],
    promotionPercentage: 0,
  })

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceEnd, setRecurrenceEnd] = useState('')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]) // All days by default
  const [recurrenceTime, setRecurrenceTime] = useState('07:00')
  const [selectedTripId, setSelectedTripId] = useState(initialTrips[0]?.id ?? '')
  const selectedTrip = useMemo(
    () => (initialTrips || []).find((t) => t.id === selectedTripId),
    [initialTrips, selectedTripId]
  )
  const [tripStopToAdd, setTripStopToAdd] = useState({
    stopId: '',
    dwellMinutes: '10',
    notes: '',
  })

  // Notification State
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState('')

  const sendNotification = async () => {
    if (!selectedTripId || !notifyMessage) return
    const data = await call(() =>
      fetch(`/api/admin/trips/${selectedTripId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notifyMessage })
      })
    )
    if (data) {
      setOk(`Message envoyé : ${data.results.sentSMS} SMS, ${data.results.sentEmail} Emails.`)
      setShowNotifyModal(false)
      setNotifyMessage('')
    }
  }

  const allStops = useMemo(() => {
    const stops: CityStop[] = []
    for (const c of initialCities) stops.push(...(c.stops || []))
    return stops
  }, [initialCities])

  const setOk = (text: string) => setNotice({ type: 'success', text })
  const setErr = (text: string) => setNotice({ type: 'error', text })

  const refresh = () => router.refresh()

  const call = async (fn: () => Promise<Response>) => {
    setLoading(true)
    setNotice(null)
    try {
      const res = await fn()
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorDetail = data?.error || res.statusText || 'Erreur inconnue';
        setErr(`Erreur: ${errorDetail}`);
        console.error('API Error:', { status: res.status, data });
        return null
      }
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur réseau est survenue';
      setErr(`Erreur technique: ${msg}`);
      console.error('Call Error:', err);
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCity = async () => {
    const data = await call(() =>
      fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName }),
      })
    )
    if (!data) return
    setNewCityName('')
    setOk('Ville créée.')
    refresh()
  }

  const createStop = async () => {
    if (!selectedCityId) return
    const data = await call(() =>
      fetch(`/api/admin/cities/${selectedCityId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStop),
      })
    )
    if (!data) return
    setNewStop({ name: '', type: 'BOTH', address: '' })
    setOk('Arrêt ajouté.')
    refresh()
  }

  /** Corps JSON aligné sur POST/PUT `/api/admin/routes` — ne pas diverger entre création et mise à jour. */
  const routeCreateUpdateBody = () => ({
    originCityId: newRoute.originCityId,
    destinationCityId: newRoute.destinationCityId,
    distance: newRoute.distance ? Number(newRoute.distance) : null,
    duration: newRoute.duration ? Number(newRoute.duration) : null,
  })

  const createRoute = async () => {
    if (initialCities.length < 2) {
      setErr('Ajoutez au moins deux villes avant de créer une route.')
      return
    }
    if (!newRoute.originCityId || !newRoute.destinationCityId) {
      setErr('Choisissez une ville de départ et une ville d’arrivée.')
      return
    }
    if (newRoute.originCityId === newRoute.destinationCityId) {
      setErr('La ville de départ et celle d’arrivée doivent être différentes.')
      return
    }
    const data = await call(() =>
      fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeCreateUpdateBody()),
      })
    )
    if (!data) return
    setOk('Route créée.')
    refresh()
  }

  const addRouteStop = async () => {
    if (!selectedRouteId) return
    const data = await call(() =>
      fetch(`/api/admin/routes/${selectedRouteId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeStopToAdd),
      })
    )
    if (!data) return
    setRouteStopToAdd({ stopId: '', role: 'STOP', notes: '' })
    setOk('Arrêt ajouté à la route.')
    refresh()
  }

  const deleteRouteStop = async (routeStopId: string) => {
    if (!selectedRouteId) return
    const data = await call(() =>
      fetch(`/api/admin/routes/${selectedRouteId}/stops/${routeStopId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Arrêt supprimé.')
    refresh()
  }

  const createTrip = async () => {
    const data = await call(() =>
      fetch('/api/admin/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTrip,
          price: Number(newTrip.price),
          boardingMinutesBefore: Number(newTrip.boardingMinutesBefore) || 30,
          // HTML datetime-local => "YYYY-MM-DDTHH:mm"
          departureTime: newTrip.departureTime ? new Date(newTrip.departureTime).toISOString() : null,
          arrivalTime: !isRecurring && newTrip.arrivalTime ? new Date(newTrip.arrivalTime).toISOString() : null,
          isRecurring,
          recurrence: isRecurring ? {
            endDate: recurrenceEnd,
            days: recurrenceDays,
            time: recurrenceTime
          } : undefined
        }),
      })
    )
    if (!data) return
    setOk('Trajet créé.')
    refresh()
  }

  const addTripStopover = async () => {
    if (!selectedTripId) return
    const data = await call(() =>
      fetch(`/api/admin/trips/${selectedTripId}/stopovers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopId: tripStopToAdd.stopId,
          dwellMinutes: tripStopToAdd.dwellMinutes ? Number(tripStopToAdd.dwellMinutes) : null,
          notes: tripStopToAdd.notes,
        }),
      })
    )
    if (!data) return
    setTripStopToAdd({ stopId: '', dwellMinutes: '10', notes: '' })
    setOk('Escale ajoutée.')
    refresh()
  }

  const deleteTripStopover = async (tripStopId: string) => {
    if (!selectedTripId) return
    const data = await call(() =>
      fetch(`/api/admin/trips/${selectedTripId}/stopovers/${tripStopId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Escale supprimée.')
    refresh()
  }

  // --- DELETE Functions for Parent Items ---

  const deleteCity = async () => {
    if (!selectedCityId) return
    if (!confirm('Voulez-vous vraiment supprimer cette ville ?')) return
    const data = await call(() =>
      fetch(`/api/admin/cities/${selectedCityId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Ville supprimée.')
    setSelectedCityId(initialCities[0]?.id === selectedCityId ? initialCities[1]?.id : initialCities[0]?.id ?? '')
    refresh()
  }

  const deleteStop = async (stopId: string) => {
    if (!selectedCityId) return
    if (!confirm('Voulez-vous vraiment supprimer cet arrêt ?')) return
    const data = await call(() =>
      fetch(`/api/admin/cities/${selectedCityId}/stops/${stopId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Arrêt supprimé.')
    refresh()
  }

  const deleteRoute = async () => {
    if (!selectedRouteId) return
    if (!confirm('Voulez-vous vraiment supprimer cette route ?')) return
    const data = await call(() =>
      fetch(`/api/admin/routes/${selectedRouteId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Route supprimée.')
    setSelectedRouteId(initialRoutes[0]?.id === selectedRouteId ? initialRoutes[1]?.id : initialRoutes[0]?.id ?? '')
    refresh()
  }

  const deleteTrip = async () => {
    if (!selectedTripId) return
    if (!confirm('Voulez-vous vraiment supprimer ce trajet ?')) return
    const data = await call(() =>
      fetch(`/api/admin/trips/${selectedTripId}`, { method: 'DELETE' })
    )
    if (!data) return
    setOk('Trajet supprimé.')
    setSelectedTripId(initialTrips[0]?.id === selectedTripId ? initialTrips[1]?.id : initialTrips[0]?.id ?? '')
    refresh()
  }

  // --- UPDATE Functions ---

  const updateCity = async () => {
    if (!selectedCityId) return
    const data = await call(() =>
      fetch(`/api/admin/cities/${selectedCityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName }),
      })
    )
    if (!data) return
    setOk('Ville mise à jour.')
    refresh()
  }

  const updateRoute = async () => {
    if (!selectedRouteId) return
    if (initialCities.length < 2) {
      setErr('Au moins deux villes sont nécessaires pour une route.')
      return
    }
    if (!newRoute.originCityId || !newRoute.destinationCityId) {
      setErr('Choisissez une ville de départ et une ville d’arrivée.')
      return
    }
    if (newRoute.originCityId === newRoute.destinationCityId) {
      setErr('La ville de départ et celle d’arrivée doivent être différentes.')
      return
    }
    const data = await call(() =>
      fetch(`/api/admin/routes/${selectedRouteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeCreateUpdateBody()),
      })
    )
    if (!data) return
    setOk('Route mise à jour.')
    refresh()
  }

  const updateTrip = async () => {
    if (!selectedTripId) return
    const data = await call(() =>
      fetch(`/api/admin/trips/${selectedTripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTrip,
          price: Number(newTrip.price),
          boardingMinutesBefore: Number(newTrip.boardingMinutesBefore) || 30,
          departureTime: newTrip.departureTime ? new Date(newTrip.departureTime).toISOString() : null,
          arrivalTime: !isRecurring && newTrip.arrivalTime ? new Date(newTrip.arrivalTime).toISOString() : null,
          promotionPercentage: Number(newTrip.promotionPercentage) || 0,
        }),
      })
    )
    if (!data) return
    setOk('Trajet mis à jour avec succès.')
    refresh()
  }

  return (
    <div className="space-y-8">
      {notice && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${notice.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {notice.text}
        </div>
      )}

      {/* 1) Villes + arrêts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Villes & Arrêts (embarquement / débarquement)</h2>
        <p className="text-sm text-gray-600 mb-6">
          Créez les villes, puis ajoutez pour chaque ville des arrêts d’embarquement/débarquement (gare, station…).
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEditingCity ? 'Modifier la ville' : 'Créer une ville'}
            </label>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Abidjan"
              />
              <button
                type="button"
                disabled={loading || !newCityName.trim()}
                onClick={isEditingCity ? updateCity : createCity}
                className={`px-4 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 ${isEditingCity ? 'bg-amber-600' : 'bg-primary-600'}`}
              >
                {isEditingCity ? 'Mettre à jour' : 'Ajouter'}
              </button>
              {isEditingCity && (
                <button
                  type="button"
                  onClick={() => { setIsEditingCity(false); setNewCityName('') }}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold bg-white"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                  >
                    {initialCities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedCityId}
                    onClick={() => {
                      if (!selectedCity) return
                      setIsEditingCity(true)
                      setNewCityName(selectedCity.name)
                      setOk('Mode édition activé pour la ville.')
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    title="Modifier la ville"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCityId}
                    onClick={deleteCity}
                    className="px-3 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600"
                    title="Supprimer la ville"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom arrêt</label>
                <input
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Ex: Gare Adjamé"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newStop.type}
                  onChange={(e) => setNewStop({ ...newStop, type: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="EMBARK">Embarquement</option>
                  <option value="DISEMBARK">Débarquement</option>
                  <option value="BOTH">Embarquement & Débarquement</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse (optionnel)</label>
                <input
                  value={newStop.address}
                  onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Quartier, avenue, repère..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={loading || !selectedCityId || !newStop.name.trim()}
                  onClick={createStop}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50"
                >
                  Ajouter l’arrêt
                </button>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Arrêts de {selectedCity?.name ?? ''}</div>
              <div className="grid md:grid-cols-2 gap-2">
                {(selectedCity?.stops || []).map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-600">
                        {s.type} {s.address ? `• ${s.address}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteStop(s.id)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="Supprimer l'arrêt"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {(selectedCity?.stops || []).length === 0 && (
                  <div className="text-sm text-gray-600">Aucun arrêt pour cette ville.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2) Routes + arrêts de route */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Routes (départ/arrivée) & Arrêts de route</h2>
        <p className="text-sm text-gray-600 mb-6">
          Créez une route (ville départ/arrivée), puis ajoutez les arrêts: embarquement, débarquement et escales.
        </p>
        {initialCities.length < 2 && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            Créez au moins deux villes dans la section ci-dessus pour pouvoir définir une route (départ et arrivée
            distincts).
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville de départ</label>
              <select
                value={newRoute.originCityId}
                onChange={(e) => setNewRoute({ ...newRoute, originCityId: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
              >
                {initialCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville d’arrivée</label>
              <select
                value={newRoute.destinationCityId}
                onChange={(e) => setNewRoute({ ...newRoute, destinationCityId: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
              >
                {initialCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                <input
                  value={newRoute.distance}
                  onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="240"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durée (h)</label>
                <input
                  value={newRoute.duration}
                  onChange={(e) => setNewRoute({ ...newRoute, duration: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="3"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={
                loading ||
                initialCities.length < 2 ||
                !newRoute.originCityId ||
                !newRoute.destinationCityId ||
                newRoute.originCityId === newRoute.destinationCityId
              }
              onClick={isEditingRoute ? updateRoute : createRoute}
              className={`w-full px-6 py-3 rounded-xl font-bold disabled:opacity-50 ${isEditingRoute ? 'bg-amber-600 text-white' : 'bg-primary-600 text-white'}`}
            >
              {isEditingRoute ? 'Mettre à jour la route' : 'Créer la route'}
            </button>
            {isEditingRoute && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingRoute(false)
                  setNewRoute({
                    originCityId: initialCities[0]?.id ?? '',
                    destinationCityId:
                      initialCities.length >= 2
                        ? pickOtherCityId(initialCities, initialCities[0]?.id ?? '')
                        : '',
                    distance: '',
                    duration: '',
                  })
                }}
                className="w-full mt-2 px-6 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold bg-white"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                <div className="flex gap-2">
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                  >
                    {initialRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.origin} → {r.destination}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedRouteId}
                    onClick={() => {
                      if (!selectedRoute) return
                      setIsEditingRoute(true)
                      setNewRoute({
                        originCityId: selectedRoute.originCityId || '',
                        destinationCityId: selectedRoute.destinationCityId || '',
                        distance: selectedRoute.distance?.toString() || '',
                        duration: selectedRoute.duration?.toString() || '',
                      })
                      setOk('Mode édition activé pour la route.')
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    title="Modifier la route"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    disabled={!selectedRouteId}
                    onClick={deleteRoute}
                    className="px-3 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600"
                    title="Supprimer la route"
                  >
                    🗑️
                  </button>
                  <button
                    type="button"
                    disabled={!selectedRouteId}
                    onClick={() => router.push(`/admin/routes/${selectedRouteId}/stops`)}
                    className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-600"
                    title="Gérer les arrêts de la route"
                  >
                    📍
                  </button>
                </div>
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrêt</label>
                <select
                  value={routeStopToAdd.stopId}
                  onChange={(e) => setRouteStopToAdd({ ...routeStopToAdd, stopId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="">-- choisir --</option>
                  {allStops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.city?.name ? `${s.city.name} - ` : '') + s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select
                  value={routeStopToAdd.role}
                  onChange={(e) => setRouteStopToAdd({ ...routeStopToAdd, role: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="STOP">Escale (embarquement & débarquement)</option>
                  <option value="BOARDING">Embarquement uniquement (BOARDING)</option>
                  <option value="ALIGHTING">Débarquement uniquement (ALIGHTING)</option>
                  <option value="EMBARQUEMENT">Embarquement uniquement</option>
                  <option value="DEBARQUEMENT">Débarquement uniquement</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                <input
                  value={routeStopToAdd.notes}
                  onChange={(e) => setRouteStopToAdd({ ...routeStopToAdd, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Info: quai, point de rendez-vous..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={loading || !selectedRouteId || !routeStopToAdd.stopId}
                  onClick={addRouteStop}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50"
                >
                  Ajouter à la route
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Arrêts de la route: {selectedRoute ? `${selectedRoute.origin} → ${selectedRoute.destination}` : ''}
              </div>
              {(selectedRoute?.stops || []).length === 0 ? (
                <div className="text-sm text-gray-600">Aucun arrêt configuré.</div>
              ) : (
                <div className="space-y-2">
                  {(selectedRoute?.stops || []).map((rs) => (
                    <div key={rs.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {rs.order}. {rs.stop.city.name} — {rs.stop.name}
                        </div>
                        <div className="text-xs text-gray-600">{rs.role}</div>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => deleteRouteStop(rs.id)}
                        className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3) Horaires + escales par trajet */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Horaires des bus & Escales</h2>
        <p className="text-sm text-gray-600 mb-6">
          Créez un trajet avec l’heure de départ et d’arrivée, puis ajoutez des escales (arrêts intermédiaires).
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
              <select
                value={newTrip.busId}
                onChange={(e) => setNewTrip({ ...newTrip, busId: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
              >
                {initialBuses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {(b.company?.name ? `${b.company.name} - ` : '') + b.name} ({b.plateNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
              <select
                value={newTrip.routeId}
                onChange={(e) => setNewTrip({ ...newTrip, routeId: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
              >
                {initialRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            </div>
            {/* Mode selection: Single vs Recurring */}
            <div className="flex items-center gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Mode :</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripMode"
                  checked={!isRecurring}
                  onChange={() => setIsRecurring(false)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-900">Simple</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripMode"
                  checked={isRecurring}
                  onChange={() => setIsRecurring(true)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-900">Périodique (Multi-dates)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRecurring ? 'Date de début' : 'Heure de départ'}
              </label>
              <input
                type="datetime-local"
                value={newTrip.departureTime}
                onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
              />
            </div>

            {isRecurring ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin (inclus)</label>
                  <input
                    type="date"
                    value={recurrenceEnd}
                    onChange={(e) => setRecurrenceEnd(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jours de la semaine</label>
                  <div className="flex flex-wrap gap-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => {
                      // 0=Dimanche in JS, but let's map text to index carefully or just use 1=Mon...7=Sun logic if needed.
                      // Actually standardized JS getDay(): 0=Sun, 1=Mon.
                      // Let's use value 1 (Mon) to 0 (Sun) match to standard
                      const dayIndex = i === 6 ? 0 : i + 1
                      const isSelected = recurrenceDays.includes(dayIndex)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            if (isSelected) setRecurrenceDays(recurrenceDays.filter(x => x !== dayIndex))
                            else setRecurrenceDays([...recurrenceDays, dayIndex])
                          }}
                          className={`px-3 py-1 text-sm rounded-lg border ${isSelected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure départ (HH:mm)</label>
                  <input
                    type="time"
                    value={recurrenceTime}
                    onChange={(e) => setRecurrenceTime(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                  <p className="text-xs text-gray-500 mt-1">L'heure sera appliquée à chaque jour sélectionné.</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heure d’arrivée</label>
                <input
                  type="datetime-local"
                  value={newTrip.arrivalTime}
                  onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix (FC)</label>
              <input
                value={newTrip.price}
                onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
              />
            </div>

            <div className="mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTrip.promoActive}
                  onChange={(e) => setNewTrip({ ...newTrip, promoActive: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">Activer la promotion</span>
              </label>
              {newTrip.promoActive && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode de promo</label>
                    <select
                      value={newTrip.promoMode}
                      onChange={(e) => setNewTrip({ ...newTrip, promoMode: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                    >
                      <option value="">Sélectionner</option>
                      <option value="MANUAL">Tarif manuel</option>
                      <option value="PERCENT">Réduction en %</option>
                      <option value="EARLY_BIRD">Early-bird</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix promo (FC)</label>
                    <input
                      value={newTrip.promoPrice}
                      onChange={(e) => setNewTrip({ ...newTrip, promoPrice: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                      placeholder="Ex: 4000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jours applicables</label>
                    <div className="flex flex-wrap gap-2">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => {
                        const dayIndex = i === 6 ? 0 : i + 1
                        const isSelected = (newTrip.promoDays || []).includes(dayIndex)
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const days = newTrip.promoDays || []
                              if (isSelected) setNewTrip({ ...newTrip, promoDays: days.filter(x => x !== dayIndex) })
                              else setNewTrip({ ...newTrip, promoDays: [...days, dayIndex] })
                            }}
                            className={`px-3 py-1 text-sm rounded-lg border ${isSelected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                          >
                            {d}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minutes avant embarquement (Boarding)</label>
              <input
                type="number"
                value={newTrip.boardingMinutesBefore}
                onChange={(e) => setNewTrip({ ...newTrip, boardingMinutesBefore: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pourcentage de promotion</label>
              <input
                type="number"
                value={newTrip.promotionPercentage || ''}
                onChange={(e) => setNewTrip({ ...newTrip, promotionPercentage: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                placeholder="Ex: 10 pour 10%"
              />
            </div>

            <button
              type="button"
              disabled={loading || !newTrip.busId || !newTrip.routeId}
              onClick={isEditingTrip ? updateTrip : createTrip}
              className={`w-full px-6 py-3 rounded-xl font-bold disabled:opacity-50 ${isEditingTrip ? 'bg-amber-600 text-white' : 'bg-primary-600 text-white'}`}
            >
              {isEditingTrip ? 'Mettre à jour le trajet' : (isRecurring ? 'Générer les trajets' : 'Créer le trajet')}
            </button>
            {isEditingTrip && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingTrip(false)
                  setNewTrip({
                    busId: initialBuses[0]?.id ?? '',
                    routeId: initialRoutes[0]?.id ?? '',
                    departureTime: '',
                    arrivalTime: '',
                    price: '5000',
                    boardingMinutesBefore: '30',
                    promoActive: false,
                    promoMode: '',
                    promoPrice: '',
                    promoDays: [],
                    promotionPercentage: 0,
                  })
                }}
                className="w-full mt-2 px-6 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold bg-white"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trajet</label>
              <div className="flex gap-2">
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  {initialTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route.origin} → {t.route.destination} • {new Date(t.departureTime).toLocaleString('fr-FR')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedTripId}
                  onClick={() => {
                    if (!selectedTrip) return
                    setIsEditingTrip(true)
                    setIsRecurring(false)
                    setNewTrip({
                      busId: selectedTrip.bus.id,
                      routeId: selectedTrip.route.id,
                      departureTime: selectedTrip.departureTime.slice(0, 16),
                      arrivalTime: selectedTrip.arrivalTime.slice(0, 16),
                      price: selectedTrip.price.toString(),
                      boardingMinutesBefore: selectedTrip.boardingMinutesBefore?.toString() || '30',
                      promoActive: selectedTrip.promoActive ?? false,
                      promoMode: selectedTrip.promoMode ?? '',
                      promoPrice: selectedTrip.promoPrice != null ? String(selectedTrip.promoPrice) : '',
                      promoDays: (() => {
                        try {
                          if (!selectedTrip.promoDays) return []
                          return Array.isArray(selectedTrip.promoDays) ? selectedTrip.promoDays : JSON.parse(selectedTrip.promoDays)
                        } catch {
                          return []
                        }
                      })(),
                      promotionPercentage: selectedTrip.promotionPercentage || 0,
                    })
                    setOk('Mode édition activé pour le trajet.')
                  }}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  title="Modifier le trajet"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  disabled={!selectedTripId}
                  onClick={deleteTrip}
                  className="px-3 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600"
                  title="Supprimer le trajet"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Escale (arrêt)</label>
                <select
                  value={tripStopToAdd.stopId}
                  onChange={(e) => setTripStopToAdd({ ...tripStopToAdd, stopId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="">-- choisir --</option>
                  {allStops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.city?.name ? `${s.city.name} - ` : '') + s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durée escale (min)</label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={tripStopToAdd.dwellMinutes}
                  onChange={(e) => setTripStopToAdd({ ...tripStopToAdd, dwellMinutes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                <input
                  value={tripStopToAdd.notes}
                  onChange={(e) => setTripStopToAdd({ ...tripStopToAdd, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="Ex: pause 15min, contrôle..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={loading || !selectedTripId || !tripStopToAdd.stopId}
                  onClick={addTripStopover}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50"
                >
                  Ajouter l’escale
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Escales du trajet {selectedTrip ? `${selectedTrip.route.origin} → ${selectedTrip.route.destination}` : ''}
              </div>
              {(selectedTrip?.stopovers || []).length === 0 ? (
                <div className="text-sm text-gray-600">Aucune escale.</div>
              ) : (
                <div className="space-y-2">
                  {(selectedTrip?.stopovers || []).map((ts) => (
                    <div key={ts.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {ts.order}. {ts.stop.city.name} — {ts.stop.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          Durée: {ts.dwellMinutes ?? 0} min
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => deleteTripStopover(ts.id)}
                        className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notification Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication Passagers</h3>
                <p className="text-sm text-gray-600 mb-4">Envoyez un message (SMS/Email) à tous les passagers de ce trajet (Retard, Annulation, Info).</p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(true)}
                    disabled={!selectedTripId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold"
                  >
                    Envoyer un message aux passagers
                  </button>
                </div>
              </div>

              {/* Notify Modal */}
              {showNotifyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold mb-4">Notifier les Passagers</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <textarea
                          className="w-full border rounded-lg p-3 h-32"
                          placeholder="Ex: Le bus aura 30 minutes de retard..."
                          value={notifyMessage}
                          onChange={e => setNotifyMessage(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowNotifyModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={sendNotification}
                          disabled={loading || !notifyMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold"
                        >
                          {loading ? 'Envoi...' : 'Envoyer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

