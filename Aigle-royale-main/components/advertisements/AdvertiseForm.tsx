'use client'

import { useState } from 'react'

const AD_TYPES = [
  { value: 'BANNER_HOMEPAGE', label: 'Bannière Accueil' },
  { value: 'BANNER_RESULTS', label: 'Bannière Résultats de recherche' },
  { value: 'BANNER_CONFIRMATION', label: 'Bannière Confirmation billet' },
]

export function AdvertiseForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    desiredType: 'BANNER_HOMEPAGE',
    desiredStartDate: '',
    desiredEndDate: '',
    imageUrl: '',
    linkUrl: '',
    message: '',
  })

  async function submit() {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/advertisements/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          desiredStartDate: form.desiredStartDate || null,
          desiredEndDate: form.desiredEndDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur lors de l’envoi')
      setSuccess(true)
      setForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        desiredType: 'BANNER_HOMEPAGE',
        desiredStartDate: '',
        desiredEndDate: '',
        imageUrl: '',
        linkUrl: '',
        message: '',
      })
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Demander un emplacement publicitaire</h2>
        <p className="text-gray-600 mt-2">
          Remplissez ce formulaire — notre équipe vous répond pour valider la période, le format et le tarif.
        </p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Demande envoyée. Nous vous contacterons rapidement.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l’entreprise *</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="Ex: Boutique XYZ"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du contact *</label>
          <input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="Ex: Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="contact@entreprise.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="+243 …"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Emplacement *</label>
          <select
            value={form.desiredType}
            onChange={(e) => setForm({ ...form, desiredType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            {AD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">URL image (optionnel)</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="https://…/banner.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Lien de redirection (optionnel)</label>
          <input
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Début souhaité</label>
          <input
            type="date"
            value={form.desiredStartDate}
            onChange={(e) => setForm({ ...form, desiredStartDate: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fin souhaitée</label>
          <input
            type="date"
            value={form.desiredEndDate}
            onChange={(e) => setForm({ ...form, desiredEndDate: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 min-h-[120px]"
            placeholder="Décrivez votre besoin (cible, objectifs, durée, etc.)"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={submit}
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>
    </div>
  )
}

