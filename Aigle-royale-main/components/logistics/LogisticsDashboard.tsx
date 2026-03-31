'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns'
import { signOut } from 'next-auth/react'
import {
  Calendar,
  Clock,
  Bus,
  User,
  MapPin,
  ChevronRight,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FileText
} from 'lucide-react'

type BusLite = { id: string; name: string; plateNumber: string }
type DriverLite = { id: string; firstName: string; lastName: string; phone: string | null; licenseNumber: string | null; isActive: boolean; bus?: BusLite | null }

type ScheduleEvent = {
  id: string
  driverId: string
  type: string // 'WORK' | 'REST' | 'SUSPENDED' | 'REVOKED' | 'SICK_LEAVE' | 'ANNUAL_LEAVE'
  startAt: string
  endAt: string
  notes: string | null
  bus?: BusLite | null
  driver?: { id: string; firstName: string; lastName: string } | null
}

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function clampIso(d: Date) {
  return d.toISOString()
}

export function LogisticsDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as any) || 'calendar'

  const [activeTab, setActiveTab] = useState<'calendar' | 'parcels' | 'issues'>(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && (tab === 'calendar' || tab === 'parcels' || tab === 'issues')) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [freightOrders, setFreightOrders] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [loadingFreight, setLoadingFreight] = useState(false)
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [submittingIssue, setSubmittingIssue] = useState(false)

  const [drivers, setDrivers] = useState<DriverLite[]>([])
  const [buses, setBuses] = useState<BusLite[]>([])
  const [driverId, setDriverId] = useState<string>('')

  const [month, setMonth] = useState<Date>(() => new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])

  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: 'WORK' as 'WORK' | 'REST' | 'SUSPENDED' | 'REVOKED' | 'SICK_LEAVE' | 'ANNUAL_LEAVE',
    busId: '',
    notes: '',
    startTime: '08:00',
    endTime: '18:00',
  })

  const [rotationOpen, setRotationOpen] = useState(false)
  const [rotationForm, setRotationForm] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    workDays: 5,
    restDays: 2,
    workStart: '08:00',
    workEnd: '18:00',
    busId: '',
    replaceExisting: true,
  })

  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<any>(null)
  const [issueForm, setIssueForm] = useState({
    type: 'LOSS',
    description: '',
    notes: ''
  })

  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return { start, end }
  }, [month])

  const days = useMemo(() => {
    const out: Date[] = []
    let cur = range.start
    while (cur <= range.end) {
      out.push(cur)
      cur = addDays(cur, 1)
    }
    return out
  }, [range])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    for (const e of events) {
      const d = new Date(e.startAt)
      const k = dayKey(d)
      const arr = map.get(k) || []
      arr.push(e)
      map.set(k, arr)
    }
    return map
  }, [events])

  const selectedDayEvents = useMemo(() => {
    return eventsByDay.get(dayKey(selectedDay)) || []
  }, [eventsByDay, selectedDay])

  async function loadDrivers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/logistics/drivers', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur chargement chauffeurs')
      setDrivers(Array.isArray(data.drivers) ? data.drivers : [])
      setBuses(Array.isArray(data.buses) ? data.buses : [])
      if (!driverId && Array.isArray(data.drivers) && data.drivers.length > 0) {
        setDriverId(data.drivers[0].id)
      }
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function loadEvents() {
    if (!driverId) {
      setEvents([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const start = clampIso(range.start)
      const end = clampIso(addDays(range.end, 1))
      const res = await fetch(`/api/logistics/schedule?driverId=${encodeURIComponent(driverId)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur chargement planning')
      setEvents(Array.isArray(data.events) ? data.events : [])
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line
  }, [driverId, range.start.getTime(), range.end.getTime()])

  async function createEvent() {
    if (!driverId) return
    setLoading(true)
    setError('')
    try {
      const day = new Date(selectedDay)
      day.setHours(0, 0, 0, 0)

      let startAt: Date
      let endAt: Date
      if (createForm.type === 'REST') {
        startAt = new Date(day)
        endAt = addDays(startAt, 1)
      } else {
        const [sh, sm] = createForm.startTime.split(':').map(Number)
        const [eh, em] = createForm.endTime.split(':').map(Number)
        startAt = new Date(day)
        startAt.setHours(sh || 0, sm || 0, 0, 0)
        endAt = new Date(day)
        endAt.setHours(eh || 0, em || 0, 0, 0)
        if (endAt <= startAt) endAt = addDays(endAt, 1)
      }

      const res = await fetch('/api/logistics/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          type: createForm.type,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          busId: createForm.type === 'WORK' ? createForm.busId : '',
          notes: createForm.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de créer')
      setCreateOpen(false)
      setCreateForm({ type: 'WORK', busId: '', notes: '', startTime: '08:00', endTime: '18:00' })
      await loadEvents()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Supprimer cet événement ?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/logistics/schedule/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de supprimer')
      await loadEvents()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function loadFreightOrders() {
    setLoadingFreight(true)
    try {
      const res = await fetch('/api/freight?role=LOGISTICS')
      const data = await res.json()
      if (res.ok) setFreightOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingFreight(false)
    }
  }

  async function loadIssues() {
    setLoadingIssues(true)
    try {
      const res = await fetch('/api/logistics/issues')
      const data = await res.json()
      if (res.ok) setIssues(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingIssues(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'parcels') {
      loadFreightOrders()
    } else if (activeTab === 'issues') {
      loadIssues()
    }
  }, [activeTab])

  async function handleStatusUpdate(id: string, status: string, busId?: string) {
    try {
      const res = await fetch(`/api/freight/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          busId,
          notes: `Validé par logistique le ${new Date().toLocaleString()}${busId ? ' - Bus assigné' : ''}`
        })
      })
      if (res.ok) {
        await loadFreightOrders()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function reportIssue() {
    if (!selectedParcel || !issueForm.description) return
    setSubmittingIssue(true)
    try {
      const res = await fetch('/api/logistics/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freightOrderId: selectedParcel.id,
          ...issueForm
        })
      })
      if (res.ok) {
        setIssueModalOpen(false)
        setIssueForm({ type: 'LOSS', description: '', notes: '' })
        await loadFreightOrders()
        if (activeTab === 'issues') await loadIssues()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingIssue(false)
    }
  }

  async function generateRotation() {
    if (!driverId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/logistics/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, ...rotationForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de générer')
      setRotationOpen(false)
      await loadEvents()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 overflow-x-auto mb-6">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'calendar' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Planning Chauffeurs
        </button>
        <button
          onClick={() => setActiveTab('parcels')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'parcels' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Gestion des Colis
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'issues' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          Gestion des Contentieux
        </button>
        <div className="flex items-center gap-4 px-4 border-l">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:block">Déconnexion</span>
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chauffeur</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} {d.licenseNumber ? `• ${d.licenseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRotationOpen(true)}
                  className="px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold"
                  disabled={loading || !driverId}
                >
                  Rotation / Repos
                </button>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
                  disabled={loading || !driverId}
                >
                  + Ajouter événement
                </button>
              </div>
            </div>

            {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setMonth(addDays(startOfMonth(month), -1))}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                >
                  ←
                </button>
                <div className="text-lg font-extrabold text-gray-900">{format(month, 'MMMM yyyy')}</div>
                <button
                  onClick={() => setMonth(addDays(endOfMonth(month), 1))}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const inMonth = isSameMonth(d, month)
                  const isSel = isSameDay(d, selectedDay)
                  const list = eventsByDay.get(dayKey(d)) || []
                  const workCount = list.filter((x) => x.type === 'WORK').length
                  const restCount = list.filter((x) => x.type === 'REST').length
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelectedDay(d)}
                      className={`text-left rounded-xl border px-3 py-2 min-h-[84px] transition-all ${isSel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                        } ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`font-bold ${inMonth ? 'text-gray-900' : 'text-gray-400'}`}>{format(d, 'd')}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {workCount > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800">{workCount} travail</span>}
                        {restCount > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-800">{restCount} repos</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-extrabold text-gray-900">{format(selectedDay, 'dd MMM yyyy')}</div>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-3 py-2 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
                  disabled={loading || !driverId}
                >
                  +
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="text-gray-600">Aucun événement.</div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((e) => {
                    let badgeClass = 'bg-gray-100 text-gray-800'
                    let label = 'Infos'
                    switch (e.type) {
                      case 'WORK':
                        badgeClass = 'bg-blue-100 text-blue-800'
                        label = 'Travail'
                        break
                      case 'REST':
                        badgeClass = 'bg-gray-100 text-gray-800'
                        label = 'Repos'
                        break
                      case 'SUSPENDED':
                        badgeClass = 'bg-red-100 text-red-800'
                        label = 'Suspendu'
                        break
                      case 'REVOKED':
                        badgeClass = 'bg-red-900 text-white'
                        label = 'Révoqué'
                        break
                      case 'SICK_LEAVE':
                        badgeClass = 'bg-yellow-100 text-yellow-800'
                        label = 'Repos médical'
                        break
                      case 'ANNUAL_LEAVE':
                        badgeClass = 'bg-green-100 text-green-800'
                        label = 'Congé annuel'
                        break
                    }

                    return (
                      <div key={e.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${badgeClass}`}>{label}</span>
                              <span className="text-xs text-gray-500 font-normal">
                                {format(new Date(e.startAt), 'HH:mm')} - {format(new Date(e.endAt), 'HH:mm')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {e.type === 'WORK' && e.bus ? `Bus: ${e.bus.name} (${e.bus.plateNumber})` : e.type === 'WORK' ? 'Bus: —' : ''}
                            </div>
                            {e.notes && <div className="text-sm text-gray-700 mt-1">{e.notes}</div>}
                          </div>
                          <button
                            onClick={() => deleteEvent(e.id)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-800 font-semibold hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Create Event Modal */}
          {createOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">Ajouter un événement</div>
                    <div className="text-sm text-gray-600">{format(selectedDay, 'dd MMM yyyy')}</div>
                  </div>
                  <button onClick={() => setCreateOpen(false)} className="text-gray-600 hover:text-gray-900 font-bold">
                    ✕
                  </button>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                    >
                      <option value="WORK">Travail</option>
                      <option value="REST">Repos</option>
                      <option value="SUSPENDED">Suspendu</option>
                      <option value="REVOKED">Révoqué</option>
                      <option value="SICK_LEAVE">Repos médical</option>
                      <option value="ANNUAL_LEAVE">Congé annuel</option>
                    </select>
                  </div>

                  {createForm.type === 'WORK' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bus (optionnel)</label>
                      <select
                        value={createForm.busId}
                        onChange={(e) => setCreateForm({ ...createForm, busId: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                      >
                        <option value="">— Aucun —</option>
                        {buses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.plateNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 flex items-end">
                      {createForm.type === 'REST' ? 'Repos' : createForm.type === 'SUSPENDED' ? 'Suspendu' : createForm.type === 'REVOKED' ? 'Révoqué' : 'Congé'} = journée complète (00:00
                      → 24:00)
                    </div>
                  )}

                  {createForm.type === 'WORK' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Début</label>
                        <input
                          type="time"
                          value={createForm.startTime}
                          onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
                        <input
                          type="time"
                          value={createForm.endTime}
                          onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <input
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                      placeholder="Dispatch, instructions…"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                  >
                    Annuler
                  </button>
                  <button onClick={createEvent} disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50">
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rotation Modal */}
          {rotationOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">Générer rotation / repos</div>
                    <div className="text-sm text-gray-600">Exemple: 5 jours travail / 2 jours repos.</div>
                  </div>
                  <button onClick={() => setRotationOpen(false)} className="text-gray-600 hover:text-gray-900 font-bold">
                    ✕
                  </button>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Début</label>
                    <input
                      type="date"
                      value={rotationForm.start}
                      onChange={(e) => setRotationForm({ ...rotationForm, start: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
                    <input
                      type="date"
                      value={rotationForm.end}
                      onChange={(e) => setRotationForm({ ...rotationForm, end: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jours travail</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={rotationForm.workDays}
                      onChange={(e) => setRotationForm({ ...rotationForm, workDays: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jours repos</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={rotationForm.restDays}
                      onChange={(e) => setRotationForm({ ...rotationForm, restDays: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure début (travail)</label>
                    <input
                      type="time"
                      value={rotationForm.workStart}
                      onChange={(e) => setRotationForm({ ...rotationForm, workStart: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure fin (travail)</label>
                    <input
                      type="time"
                      value={rotationForm.workEnd}
                      onChange={(e) => setRotationForm({ ...rotationForm, workEnd: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bus (optionnel pour jours travail)</label>
                    <select
                      value={rotationForm.busId}
                      onChange={(e) => setRotationForm({ ...rotationForm, busId: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                    >
                      <option value="">— Aucun —</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.plateNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={rotationForm.replaceExisting}
                        onChange={(e) => setRotationForm({ ...rotationForm, replaceExisting: e.target.checked })}
                      />
                      Remplacer (supprimer les événements existants dans la période)
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setRotationOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                  >
                    Annuler
                  </button>
                  <button onClick={generateRotation} disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50">
                    Générer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8">
          {loadingFreight ? (
            <div className="text-center py-12 text-gray-600">Chargement des colis...</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Scannez le QR code ou recherchez le code de suivi pour confirmer le chargement.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Voulez-vous vraiment supprimer définitivement tous les colis livrés ? Cette action nécessite une validation administrateur.')) {
                      setLoadingFreight(true)
                      try {
                        const res = await fetch('/api/freight/delivered', { method: 'DELETE' })
                        const data = await res.json()
                        if (res.ok) {
                          alert(data.message)
                          await loadFreightOrders()
                        } else {
                          alert(data.error || 'Erreur lors de la suppression')
                        }
                      } catch (e) {
                        console.error(e)
                      } finally {
                        setLoadingFreight(false)
                      }
                    }
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                >
                  Nettoyer les colis livrés (Admin)
                </button>
              </div>

              <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center mb-8">
                <p className="text-gray-500 mb-2 font-semibold">Simuler scan QR Code</p>
                <input
                  type="text"
                  placeholder="Code de suivi..."
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const code = (e.target as HTMLInputElement).value
                      const order = freightOrders.find((o) => o.trackingCode === code)
                      if (order) handleStatusUpdate(order.id, 'EMBARKED')
                        ; (e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
              </div>

              {/* Section Colis Réceptionnés (À expédier) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Colis en Attente (Reçus pour Expédition)
                </h3>
                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet / Bus</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {freightOrders
                        .filter((o) => o.status === 'RECEIVED' || o.status === 'EMBARKED' || o.status === 'ISSUE')
                        .map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-primary-700">{o.trackingCode}</div>
                              <div className="text-[10px] text-gray-500">{o.senderName} → {o.receiverName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {o.trip.route.origin} → {o.trip.route.destination}
                              </div>
                              <div className="text-xs text-gray-500">
                                Bus assigné: {o.bus?.name || 'Non assigné'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-full ${o.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                                  o.status === 'EMBARKED' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                              >
                                {o.status === 'RECEIVED' ? 'REÇU' : o.status === 'EMBARKED' ? 'EMBARQUÉ' : 'LITIGE'}
                              </div>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              {o.status === 'RECEIVED' && (
                                <div className="flex gap-2 items-center">
                                  <select
                                    className="text-xs border rounded p-1"
                                    onChange={(e) => o._selectedBusId = e.target.value}
                                    defaultValue={o.busId || o.trip.busId || ''}
                                  >
                                    <option value="">Assigner Bus...</option>
                                    {buses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                  </select>
                                  <button
                                    onClick={() => handleStatusUpdate(o.id, 'EMBARKED', o._selectedBusId || o.busId || o.trip.busId)}
                                    className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700 font-bold"
                                  >
                                    Embarquer
                                  </button>
                                </div>
                              )}
                              {(o.status === 'RECEIVED' || o.status === 'EMBARKED') && (
                                <button
                                  onClick={() => {
                                    setSelectedParcel(o)
                                    setIssueModalOpen(true)
                                  }}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                                >
                                  Signaler Problème
                                </button>
                              )}
                              {o.status === 'EMBARKED' && (
                                <button
                                  onClick={() => handleStatusUpdate(o.id, 'DELIVERED')}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                                >
                                  Délivrer
                                </button>
                              )}
                              {o.status === 'ISSUE' && <div className="text-red-600 font-bold text-xs">⚠️ Litige en cours</div>}
                            </td>
                          </tr>
                        ))}
                      {freightOrders.filter((o) => o.status === 'RECEIVED' || o.status === 'EMBARKED' || o.status === 'ISSUE').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">Aucun colis en attente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section Colis Livrés (Archives) */}
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Colis Livrés (Historique Récent)
                </h3>
                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {freightOrders
                        .filter((o) => o.status === 'DELIVERED')
                        .map((o) => (
                          <tr key={o.id} className="bg-gray-50/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-gray-400">{o.trackingCode}</div>
                              <div className="text-[10px] text-gray-400">{o.senderName} → {o.receiverName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-500">
                                {o.trip.route.origin} → {o.trip.route.destination}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">LIVRÉ</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                              {format(new Date(o.updatedAt || o.createdAt), 'dd/MM/yyyy')}
                            </td>
                          </tr>
                        ))}
                      {freightOrders.filter((o) => o.status === 'DELIVERED').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">Aucun colis archivé.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Litige */}
      {issueModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
          onClick={() => !submittingIssue && setIssueModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Signaler un litige</h3>
              <button
                onClick={() => setIssueModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                disabled={submittingIssue}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 bg-red-50 p-3 rounded-2xl border border-red-100">
                <div className="bg-red-100 p-2 rounded-xl">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-red-600 font-bold uppercase tracking-wider">Référence Colis</div>
                  <div className="text-lg font-mono font-black text-gray-900">{selectedParcel?.trackingCode}</div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nature du problème</label>
                  <select
                    value={issueForm.type}
                    onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-2xl p-3 bg-gray-50 focus:bg-white focus:border-red-500 transition-all outline-none font-semibold text-gray-700"
                    disabled={submittingIssue}
                  >
                    <option value="LOSS">Perte de colis</option>
                    <option value="NOT_LOADED">Colis non chargé (Oubli)</option>
                    <option value="RETURNED">Retourné à l'expéditeur</option>
                    <option value="DAMAGED">Colis détérioré</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description détaillée</label>
                  <textarea
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:border-red-500 transition-all outline-none min-h-[120px]"
                    placeholder="Expliquez précisément les circonstances..."
                    disabled={submittingIssue}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIssueModalOpen(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                  disabled={submittingIssue}
                >
                  Annuler
                </button>
                <button
                  onClick={reportIssue}
                  disabled={submittingIssue || !issueForm.description}
                  className="flex-[2] px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingIssue ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement...
                    </>
                  ) : 'Valider le litige'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Issues */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Suivi des Contentieux</h2>
          {loadingIssues ? (
            <div className="text-center py-12 text-gray-600">Chargement...</div>
          ) : (
            <div className="grid gap-4">
              {issues.map(issue => (
                <div key={issue.id} className="border rounded-xl p-4 hover:border-primary-200 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${issue.type === 'LOSS' ? 'bg-red-900 text-white' :
                        issue.type === 'NOT_LOADED' ? 'bg-orange-100 text-orange-800' :
                          issue.type === 'RETURNED' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {issue.type === 'LOSS' ? 'PERTE' :
                          issue.type === 'NOT_LOADED' ? 'NON CHARGÉ' :
                            issue.type === 'RETURNED' ? 'RETOURNÉ' : 'DÉTÉRIORÉ'}
                      </span>
                      <h4 className="font-bold text-gray-900 mt-1">{issue.freightOrder.trackingCode}</h4>
                    </div>
                    <div className="text-xs text-gray-500">{format(new Date(issue.reportedAt), 'dd/MM/yyyy HH:mm')}</div>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg italic">"{issue.description}"</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Trajet: {issue.freightOrder.trip.route.origin} → {issue.freightOrder.trip.route.destination}
                  </div>
                </div>
              ))}
              {issues.length === 0 && <p className="text-center py-12 text-gray-500 italic">Aucun litige en cours.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

