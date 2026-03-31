'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/layout/Navigation'

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'RESERVATION', label: 'Réservation / billet' },
  { id: 'PAYMENT', label: 'Paiement' },
  { id: 'BAGGAGE', label: 'Bagages' },
  { id: 'SERVICE', label: 'Service à bord / personnel' },
  { id: 'OTHER', label: 'Autre' },
]

export default function NewComplaintPage() {
  const { data: session, status } = useSession()
  const [category, setCategory] = useState('RESERVATION')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [bookingHint, setBookingHint] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ reference: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user?.name && session.user.email) {
      setContactName(session.user.name)
      setContactEmail(session.user.email)
    }
  }, [session])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/support/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          description,
          contactName,
          contactEmail,
          contactPhone,
          bookingHint,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Erreur')
        return
      }
      setDone({ reference: data.complaint.reference })
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Link href="/support" className="text-sm font-medium text-primary-600 hover:underline mb-4 inline-block">
          ← Support
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Plainte / réclamation</h1>
        <p className="text-gray-600 text-sm mb-8">
          Vous recevrez une <strong>référence unique</strong> pour le suivi. Les champs marqués * sont obligatoires.
        </p>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <p className="text-green-800 font-bold text-lg mb-2">Demande enregistrée</p>
            <p className="text-gray-700 mb-4">
              Votre référence :{' '}
              <span className="font-mono font-black text-xl text-primary-700">{done.reference}</span>
            </p>
            <p className="text-sm text-gray-600 mb-6">Conservez cette référence pour toute correspondance.</p>
            <Link href="/support" className="text-primary-600 font-semibold hover:underline">
              Retour au hub support
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
            {status === 'unauthenticated' && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Vous pouvez déposer une plainte sans compte : renseignez nom et email ci-dessous.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objet *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
                minLength={3}
                placeholder="Résumé court du problème"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border rounded-lg px-3 py-2"
                required
                minLength={10}
                placeholder="Dates, trajet, ce qui s’est passé…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° billet / info réservation (optionnel)
              </label>
              <input
                value={bookingHint}
                onChange={(e) => setBookingHint(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                placeholder="Ex. ticket ou code de réservation"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="+243…"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Envoi…' : 'Envoyer la plainte'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
