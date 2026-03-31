'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminSupportSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappPrefill, setWhatsappPrefill] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/support/settings', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setWhatsappNumber(data.whatsappNumber || '')
          setWhatsappPrefill(data.whatsappPrefill || '')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/support/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber, whatsappPrefill }),
      })
      if (!res.ok) throw new Error('fail')
      setMessage({ type: 'success', text: 'Paramètres enregistrés. Le bouton WhatsApp sur /support utilisera ce numéro.' })
    } catch {
      setMessage({ type: 'error', text: 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/support" className="text-sm font-medium text-primary-600 hover:underline mb-2 inline-block">
          ← Support client
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres WhatsApp (support)</h1>
        <p className="text-gray-600 text-sm mt-1">
          Indiquez le numéro WhatsApp Business (chiffres uniquement, indicatif pays inclus, sans +).
        </p>
      </div>

      {loading ? (
        <p className="text-gray-600">Chargement…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro WhatsApp</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full border rounded-lg px-4 py-2 font-mono"
              placeholder="243900000000"
            />
            <p className="text-xs text-gray-500 mt-1">Exemple RDC : 243 suivi du numéro mobile.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message prérempli (optionnel)</label>
            <textarea
              value={whatsappPrefill}
              onChange={(e) => setWhatsappPrefill(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}
