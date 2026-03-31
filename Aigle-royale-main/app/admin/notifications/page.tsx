'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Campaign = {
  id: string
  title: string
  channels: string
  audience: string
  status: string
  totalTargets: number
  totalSent: number
  totalFailed: number
  createdAt: string
}

type NotificationLog = {
  id: string
  channel: string
  recipient: string | null
  status: string
  createdAt: string
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'ALL_USERS' | 'ACTIVE_USERS'>('ALL_USERS')
  const [channels, setChannels] = useState<string[]>(['APP'])
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])

  const channelOptions = useMemo(
    () => [
      { id: 'SMS', label: 'SMS' },
      { id: 'WHATSAPP', label: 'WhatsApp' },
      { id: 'EMAIL', label: 'Email' },
      { id: 'APP', label: 'Notification app' },
    ],
    []
  )

  const loadData = async () => {
    const response = await fetch('/api/admin/notifications', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) return
    setCampaigns(data.campaigns || [])
    setLogs(data.recentLogs || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleChannel = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((ch) => ch !== channel) : [...prev, channel]
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim() || channels.length === 0) {
      setFeedback({ type: 'error', text: 'Renseignez titre, message et au moins un canal.' })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, audience, channels }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Envoi impossible.' })
        return
      }
      setFeedback({
        type: 'success',
        text: `Campagne envoyee. Cibles: ${data.result.totalTargets}, sent: ${data.result.totalSent}, failed: ${data.result.totalFailed}.`,
      })
      setTitle('')
      setMessage('')
      await loadData()
    } catch {
      setFeedback({ type: 'error', text: 'Erreur technique lors de l envoi.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Module Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            Envoi multi-canal: SMS, WhatsApp, Email et notification app.
          </p>
        </div>
        <Link
          href="/admin/notifications/brevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-sm hover:bg-amber-100 transition-colors"
        >
          Configuration Brevo (email / SMS)
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle campagne</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ex: Retard sur depart de 16h30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Votre bus aura un retard de 20 minutes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as 'ALL_USERS' | 'ACTIVE_USERS')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL_USERS">Tous les utilisateurs</option>
                <option value="ACTIVE_USERS">Utilisateurs actifs seulement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Canaux</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {channelOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={channels.includes(option.id)}
                      onChange={() => toggleChannel(option.id)}
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {feedback && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Envoi en cours...' : 'Envoyer la campagne'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Derniers envois</h2>
          <div className="space-y-3 max-h-[420px] overflow-auto">
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune campagne pour le moment.</p>
            ) : (
              campaigns.slice(0, 8).map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-3">
                  <div className="font-semibold text-gray-900 text-sm">{campaign.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{campaign.channels}</div>
                  <div className="text-xs text-gray-500">
                    Cibles: {campaign.totalTargets} | Sent: {campaign.totalSent} | Failed: {campaign.totalFailed}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logs recents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Destinataire</th>
                <th className="py-2 pr-3">Statut</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{log.channel}</td>
                  <td className="py-2 pr-3 text-gray-600">{log.recipient || '-'}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        log.status === 'SENT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={4}>
                    Aucun log disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
