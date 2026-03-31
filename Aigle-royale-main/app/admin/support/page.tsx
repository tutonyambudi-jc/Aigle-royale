'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Complaint = {
  id: string
  reference: string
  category: string
  subject: string
  description: string
  status: string
  priority: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  bookingHint: string | null
  adminNotes: string | null
  createdAt: string
  user: { email: string; firstName: string; lastName: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

export default function AdminSupportPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const q = filter ? `?status=${encodeURIComponent(filter)}` : ''
      const res = await fetch(`/api/admin/support/complaints${q}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setComplaints(data.complaints || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  useEffect(() => {
    if (selected) setNotesDraft(selected.adminNotes || '')
  }, [selected])

  const patch = async (id: string, fields: { status?: string; priority?: string; adminNotes?: string }) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/support/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      })
      const data = await res.json()
      if (res.ok) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? data.complaint : c)))
        if (selected?.id === id) setSelected(data.complaint)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support client</h1>
          <p className="text-sm text-gray-600 mt-1">Plaintes et réclamations — suivi et traitement</p>
        </div>
        <Link
          href="/admin/support/settings"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800 text-sm"
        >
          Paramètres WhatsApp
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600">Filtrer :</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLVED">Résolu</option>
          <option value="CLOSED">Fermé</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="text-sm font-semibold text-primary-600 hover:underline"
        >
          Actualiser
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Chargement…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Réf.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Objet</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-primary-700">{c.reference}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <span className="text-xs text-gray-500 uppercase">{c.category}</span>
                      <br />
                      {c.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.contactName}
                      <br />
                      <span className="text-xs text-gray-500">{c.contactEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          c.status === 'OPEN'
                            ? 'bg-amber-100 text-amber-900'
                            : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-900'
                              : c.status === 'RESOLVED'
                                ? 'bg-green-100 text-green-900'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(c)}
                        className="text-primary-600 font-semibold hover:underline"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {complaints.length === 0 && (
            <p className="p-8 text-center text-gray-500">Aucune plainte pour ce filtre.</p>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono font-black text-xl text-primary-700">{selected.reference}</p>
                <p className="text-sm text-gray-500">{new Date(selected.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <p>
                <strong>Catégorie :</strong> {selected.category}
              </p>
              <p>
                <strong>Objet :</strong> {selected.subject}
              </p>
              <p>
                <strong>Description :</strong>
              </p>
              <p className="bg-gray-50 rounded-lg p-3 text-gray-800 whitespace-pre-wrap">{selected.description}</p>
              {selected.bookingHint && (
                <p>
                  <strong>Info réservation :</strong> {selected.bookingHint}
                </p>
              )}
              <p>
                <strong>Contact :</strong> {selected.contactName} — {selected.contactEmail}
                {selected.contactPhone && ` — ${selected.contactPhone}`}
              </p>
              {selected.user && (
                <p className="text-xs text-gray-500">
                  Compte lié : {selected.user.firstName} {selected.user.lastName} ({selected.user.email})
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select
                  value={selected.status}
                  onChange={(e) => patch(selected.id, { status: e.target.value })}
                  disabled={saving}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="OPEN">Ouvert</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="RESOLVED">Résolu</option>
                  <option value="CLOSED">Fermé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
                <select
                  value={selected.priority}
                  onChange={(e) => patch(selected.id, { priority: e.target.value })}
                  disabled={saving}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="LOW">Basse</option>
                  <option value="NORMAL">Normale</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes internes</label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Visible uniquement côté admin"
              />
              <button
                type="button"
                onClick={() => patch(selected.id, { adminNotes: notesDraft })}
                disabled={saving}
                className="mt-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-50"
              >
                Enregistrer les notes
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full py-2 rounded-lg border border-gray-200 text-gray-700 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
