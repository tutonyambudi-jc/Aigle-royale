'use client'

import { useEffect, useMemo, useState } from 'react'

type Advertisement = {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  type: string
  status: string
  startDate: string
  endDate: string
  impressions: number
  clicks: number
  createdAt: string
}

type Inquiry = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string | null
  message: string | null
  desiredType: string
  desiredStartDate: string | null
  desiredEndDate: string | null
  imageUrl: string | null
  linkUrl: string | null
  status: string
  createdAt: string
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString()
  } catch {
    return dt
  }
}

export function AdsManager() {
  const [tab, setTab] = useState<'ads' | 'inquiries'>('ads')

  const [ads, setAds] = useState<Advertisement[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    type: 'BANNER_HOMEPAGE',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadAds() {
    const res = await fetch('/api/advertisements', { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Erreur chargement publicités')
    setAds(Array.isArray(data) ? data : [])
  }

  async function loadInquiries() {
    const res = await fetch('/api/advertisements/inquiries', { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Erreur chargement demandes')
    setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : [])
  }

  async function reloadAll() {
    await Promise.all([loadAds(), loadInquiries()])
  }

  useEffect(() => {
    setBusy(true)
    setError('')
    reloadAll()
      .catch((e: any) => setError(e?.message || 'Une erreur est survenue'))
      .finally(() => setBusy(false))
    // eslint-disable-next-line
  }, [])

  const kpis = useMemo(() => {
    const active = ads.filter((a) => a.status === 'ACTIVE').length
    const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0)
    const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0)
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    return { active, totalImpressions, totalClicks, ctr }
  }, [ads])

  async function createAd() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || null,
          imageUrl: createForm.imageUrl,
          linkUrl: createForm.linkUrl || null,
          type: createForm.type,
          startDate: createForm.startDate,
          endDate: createForm.endDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de créer la publicité')
      setCreateOpen(false)
      setCreateForm({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        type: 'BANNER_HOMEPAGE',
        startDate: '',
        endDate: '',
        status: 'ACTIVE',
      })
      await loadAds()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setBusy(false)
    }
  }

  async function updateAdStatus(id: string, status: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/advertisements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de mettre à jour')
      await loadAds()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setBusy(false)
    }
  }

  async function updateInquiryStatus(id: string, status: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/advertisements/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossible de mettre à jour')
      await loadInquiries()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-600">Publicités actives</div>
          <div className="text-3xl font-extrabold text-gray-900">{kpis.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-600">Impressions (total)</div>
          <div className="text-3xl font-extrabold text-gray-900">{kpis.totalImpressions}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-600">Clics (total)</div>
          <div className="text-3xl font-extrabold text-gray-900">{kpis.totalClicks}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-600">CTR</div>
          <div className="text-3xl font-extrabold text-gray-900">{kpis.ctr.toFixed(2)}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('ads')}
            className={`px-4 py-2 rounded-lg font-bold ${tab === 'ads' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            Publicités
          </button>
          <button
            onClick={() => setTab('inquiries')}
            className={`px-4 py-2 rounded-lg font-bold ${tab === 'inquiries' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            Demandes
          </button>
        </div>
        <div className="flex items-center gap-3">
          <a href="/advertise" className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold">
            Page “Annoncez ici”
          </a>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
            disabled={busy}
          >
            + Nouvelle pub
          </button>
        </div>
      </div>

      {tab === 'ads' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3">Titre</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Période</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-right p-3">Impr.</th>
                  <th className="text-right p-3">Clics</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.linkUrl || '—'}</div>
                    </td>
                    <td className="p-3">{a.type}</td>
                    <td className="p-3">
                      <div className="text-xs text-gray-600">{fmt(a.startDate)}</div>
                      <div className="text-xs text-gray-600">{fmt(a.endDate)}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">{a.impressions}</td>
                    <td className="p-3 text-right">{a.clicks}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-2">
                        {a.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateAdStatus(a.id, 'INACTIVE')}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                            disabled={busy}
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => updateAdStatus(a.id, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold disabled:opacity-50"
                            disabled={busy}
                          >
                            Activer
                          </button>
                        )}
                        <a
                          href={a.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                        >
                          Image
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {ads.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-600" colSpan={7}>
                      Aucune publicité.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3">Entreprise</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Emplacement</th>
                  <th className="text-left p-3">Période</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{q.companyName}</div>
                      <div className="text-xs text-gray-500">{fmt(q.createdAt)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900">{q.contactName}</div>
                      <div className="text-xs text-gray-500">{q.email}{q.phone ? ` • ${q.phone}` : ''}</div>
                    </td>
                    <td className="p-3">{q.desiredType}</td>
                    <td className="p-3">
                      <div className="text-xs text-gray-600">{q.desiredStartDate ? fmt(q.desiredStartDate) : '—'}</div>
                      <div className="text-xs text-gray-600">{q.desiredEndDate ? fmt(q.desiredEndDate) : '—'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800">{q.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={q.status}
                        onChange={(e) => updateInquiryStatus(q.id, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white"
                        disabled={busy}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-600" colSpan={6}>
                      Aucune demande.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-gray-900">Nouvelle publicité</div>
                <div className="text-sm text-gray-600">Les pubs actives s’affichent automatiquement sur le site.</div>
              </div>
              <button onClick={() => setCreateOpen(false)} className="text-gray-600 hover:text-gray-900 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre *</label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL *</label>
                <input
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="https://…/banner.jpg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lien (optionnel)</label>
                <input
                  value={createForm.linkUrl}
                  onChange={(e) => setCreateForm({ ...createForm, linkUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white"
                >
                  <option value="BANNER_HOMEPAGE">BANNER_HOMEPAGE</option>
                  <option value="BANNER_RESULTS">BANNER_RESULTS</option>
                  <option value="BANNER_CONFIRMATION">BANNER_CONFIRMATION</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Période *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={createAd}
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

