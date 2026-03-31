'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

type BusData = {

  id?: string
  companyName: string
  name: string
  plateNumber: string
  brand: string
  capacity: number
  amenities: string
  seatType: 'STANDARD' | 'VIP'
  imageUrl?: string | null
}

interface BusFormProps {
  initialData?: BusData | null
  onSuccess?: () => void
}

export function BusRegistrationForm({ initialData, onSuccess }: BusFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<BusData>(
    initialData || {
      companyName: '',
      name: '',
      plateNumber: '',
      brand: '',
      capacity: 50,
      amenities: 'WiFi, Climatisation, USB',
      seatType: 'STANDARD',
      imageUrl: '',
    }
  )
  const isEditing = !!initialData?.id

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5Mo' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm({ ...form, imageUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const url = isEditing ? `/api/admin/buses/${initialData.id}` : '/api/admin/buses'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      let data
      try {
        const text = await res.text()
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error(`Erreur serveur (${res.status}): ${text.substring(0, 100)}`)
        }
      } catch (e: any) {
        setMessage({ type: 'error', text: e.message || 'Erreur de communication avec le serveur' })
        setLoading(false)
        return
      }

      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || `Impossible de ${isEditing ? 'modifier' : 'créer'} le bus` })
        setLoading(false)
        return
      }
      setMessage({ type: 'success', text: `Bus ${isEditing ? 'modifié' : 'enregistré'} avec succès.` })

      if (!isEditing) {
        setForm({
          companyName: '',
          name: '',
          plateNumber: '',
          brand: '',
          capacity: 50,
          amenities: 'WiFi, Climatisation, USB',
          seatType: 'STANDARD',
        })
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch {
      setMessage({ type: 'error', text: 'Une erreur est survenue' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Modifier le bus' : 'Enregistrer une compagnie / un bus'}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing
            ? 'Modifiez les informations du véhicule.'
            : 'Renseignez la compagnie, la marque, le nombre de sièges disponibles et les amenities.'}
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom compagnie de bus</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Aigle Royale"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom du bus</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Bus VIP 3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Immatriculation</label>
          <input
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: AR-003-AB"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image du bus</label>
          <div className="flex items-start gap-4">
            {form.imageUrl && (
              <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={form.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="mt-1 text-xs text-gray-500">PNG, JPG jusqu'à 5Mo</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marque du bus</label>
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Yutong, Mercedes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de sièges disponibles</label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={form.seatType}
            onChange={(e) => setForm({ ...form, seatType: e.target.value as 'STANDARD' | 'VIP' })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (séparées par virgule)</label>
          <input
            value={form.amenities}
            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="WiFi, Climatisation, USB, TV..."
          />
        </div>

        <div className="md:col-span-2 flex justify-end pt-2 gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Enregistrer'}
          </button>
        </div>
      </form >
    </div >
  )
}

