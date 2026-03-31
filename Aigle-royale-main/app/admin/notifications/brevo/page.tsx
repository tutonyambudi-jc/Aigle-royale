'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminBrevoSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [smsSender, setSmsSender] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/settings/brevo', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Erreur')
        if (cancelled) return
        setHasApiKey(Boolean(data.hasApiKey))
        setSenderEmail(data.senderEmail || '')
        setSenderName(data.senderName || '')
        setSmsSender(data.smsSender || '')
        setEmailEnabled(Boolean(data.emailEnabled))
        setSmsEnabled(Boolean(data.smsEnabled))
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'Impossible de charger la configuration Brevo.' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          senderEmail,
          senderName,
          smsSender,
          emailEnabled,
          smsEnabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      setMessage({ type: 'success', text: 'Configuration Brevo enregistrée.' })
      setApiKeyInput('')
      if (apiKeyInput.trim()) setHasApiKey(true)
    } catch {
      setMessage({ type: 'error', text: 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  const clearKey = async () => {
    if (!confirm('Supprimer la clé API stockée en base ? Les variables BREVO_* du serveur restent utilisées si définies.')) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearApiKey: true,
          senderEmail,
          senderName,
          smsSender,
          emailEnabled,
          smsEnabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur')
      setHasApiKey(false)
      setApiKeyInput('')
      setMessage({ type: 'success', text: 'Clé API supprimée de la base.' })
    } catch {
      setMessage({ type: 'error', text: 'Action impossible.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration Brevo</h1>
          <p className="text-gray-600">
            Connectez l’envoi d’emails et de SMS transactionnels à votre compte Brevo (ex-Sendinblue).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/notifications"
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800 text-sm"
          >
            ← Module notifications
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-gray-600">Chargement…</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-black text-amber-700 tracking-tight">Brevo</span>
              <span className="text-xs font-semibold uppercase text-amber-800/80">API transactionnelle</span>
            </div>
            <p className="text-sm text-gray-600">
              Créez une clé API dans le tableau Brevo (SMTP & API). L’expéditeur email doit être vérifié. Pour les SMS,
              activez le canal SMS sur votre compte Brevo.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clé API Brevo</label>
              <input
                type="password"
                autoComplete="off"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={hasApiKey ? '•••• laisser vide pour conserver la clé enregistrée' : 'xkeysib-…'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              {hasApiKey && (
                <p className="text-xs text-green-700 mt-1">Une clé est déjà enregistrée en base.</p>
              )}
              <button
                type="button"
                onClick={clearKey}
                disabled={saving || !hasApiKey}
                className="mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
              >
                Supprimer la clé stockée en base
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-gray-900">Email</h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Activer
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email expéditeur (vérifié)</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="noreply@votredomaine.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom affiché</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Aigle Royale"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-gray-900">SMS</h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Activer
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expéditeur SMS (3–11 car.)</label>
                  <input
                    type="text"
                    value={smsSender}
                    onChange={(e) => setSmsSender(e.target.value)}
                    maxLength={11}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="AigleRoyale"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Numéros destinataires au format international (+243…). Vérifiez les crédits SMS Brevo.
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-xl p-4 text-sm ${
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
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 shadow-lg"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer la configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
