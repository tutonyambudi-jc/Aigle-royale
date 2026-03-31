'use client'

import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'

type Company = { id: string; name: string }
type Bus = { id: string; name: string; plateNumber: string; company?: { id: string; name: string } | null }

type Status = 'ALL' | 'CONFIRMED' | 'PENDING' | 'CHECKED_IN'

function ymdToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function onlyDigits(s: string): string {
  return s.replace(/[^\d]/g, '')
}

export function PassengerManifestManager({
  companies,
  buses,
}: {
  companies: Company[]
  buses: Bus[]
}) {
  const today = useMemo(() => ymdToday(), [])
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [companyId, setCompanyId] = useState('')
  const [busId, setBusId] = useState('')
  const [status, setStatus] = useState<Status>('ALL')

  const [expiresInDays, setExpiresInDays] = useState(7)
  const [emailTo, setEmailTo] = useState('')
  const [whatsAppTo, setWhatsAppTo] = useState('')

  const [shareUrl, setShareUrl] = useState<string>('')
  const [shareExpiresAt, setShareExpiresAt] = useState<string>('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])

  const manifestQuery = useMemo(() => {
    const qs = new URLSearchParams()
    qs.set('from', from)
    if (to) qs.set('to', to)
    if (companyId) qs.set('companyId', companyId)
    if (busId) qs.set('busId', busId)
    if (status) qs.set('status', status)
    return qs.toString()
  }, [from, to, companyId, busId, status])

  const downloadUrl = useMemo(() => `/api/admin/manifests/passengers?${manifestQuery}`, [manifestQuery])

  async function handleCreateShareLink() {
    setShareError('')
    setShareLoading(true)
    setShareUrl('')
    setShareExpiresAt('')
    try {
      const res = await fetch('/api/admin/manifests/passengers/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          companyId,
          busId,
          status,
          expiresInDays,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setShareError(data?.error || 'Impossible de créer le lien')
        return
      }
      setShareUrl(data.shareUrl)
      setShareExpiresAt(data.expiresAt ? new Date(data.expiresAt).toLocaleString() : '')
    } catch {
      setShareError('Impossible de créer le lien')
    } finally {
      setShareLoading(false)
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  function openMailShare() {
    if (!shareUrl) return
    const subject = 'Manifest passagers (CSV)'
    const body = `Bonjour,%0D%0A%0D%0AVoici le lien sécurisé pour télécharger le manifest passagers :%0D%0A${encodeURIComponent(
      shareUrl
    )}%0D%0A%0D%0A(Ce lien peut expirer.)%0D%0A`
    const toPart = emailTo.trim()
    window.location.href = `mailto:${encodeURIComponent(toPart)}?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  function openWhatsAppShare() {
    if (!shareUrl) return
    const msg = `Manifest passagers (CSV) : ${shareUrl}`
    const digits = onlyDigits(whatsAppTo.trim())
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadPdf() {
    setPdfLoading(true)
    setShareError('')
    try {
      // 1. Fetch JSON data
      const res = await fetch(`/api/admin/manifests/passengers?${manifestQuery}&format=json`) // format=json
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de la récupération des données')

      const bookings = data.bookings || []
      setBookings(bookings)

      // 2. Generate PDF
      // @ts-ignore
      const doc = new jsPDF()

      // Title
      const mainTitle = status === 'CHECKED_IN' ? "Manifest des Passagers Enregistrés (Check-in)" : "Manifest Passagers"
      doc.setFontSize(18)
      doc.text(mainTitle, 14, 20)

      doc.setFontSize(10)
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Période: ${from} au ${to}`, 14, 34)

      // Simple table construction
      let y = 45
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")

      // Headers
      const headers = ["Heure", "Compagnie", "Bus", "Chauffeur", "Trajet", "Siège", "Passager", "Enregistré le"]
      // Optimized for longer passenger names:
      const xPositions = [14, 25, 45, 65, 85, 112, 122, 165]

      headers.forEach((h, i) => doc.text(h, xPositions[i], y))

      y += 5
      doc.setFont("helvetica", "normal")

      bookings.forEach((b: any) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }

        const time = new Date(b.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const company = (b.companyName || '—').substring(0, 15)
        const bus = (b.plateNumber || '—').substring(0, 10)
        const driver = (b.drivers || '—').substring(0, 12)
        const route = (b.route || '—').substring(0, 12)
        const seat = b.seatNumber || '—'
        const passenger = b.passengerName.substring(0, 25)
        const checkInTime = b.checkedInAt ? new Date(b.checkedInAt).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

        doc.text(time, xPositions[0], y)
        doc.text(company, xPositions[1], y)
        doc.text(bus, xPositions[2], y)
        doc.text(driver, xPositions[3], y)
        doc.text(route, xPositions[4], y)
        doc.text(seat, xPositions[5], y)
        doc.text(passenger, xPositions[6], y)
        doc.text(checkInTime, xPositions[7], y)

        y += 6
      })

      if (bookings.length === 0) {
        doc.text("Aucune réservation trouvée pour cette période.", 14, y + 10)
      }

      const filenamePrefix = status === 'CHECKED_IN' ? 'manifest_checkin' : 'manifest'
      doc.save(`${filenamePrefix}_${from}_${to}.pdf`)

    } catch (e) {
      console.error(e)
      setShareError("Impossible de générer le PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleLoadPreview() {
    setPreviewLoading(true)
    setShareError('')
    try {
      const res = await fetch(`/api/admin/manifests/passengers?${manifestQuery}&format=json`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setBookings(data.bookings || [])
    } catch (e: any) {
      setShareError(e.message || "Erreur de chargement")
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manifest passagers</h2>
        <p className="text-gray-600 text-sm">
          Téléchargement CSV + partage sécurisé par lien (email / WhatsApp).
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compagnie</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Toutes les compagnies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bus (optionnel)</label>
          <select
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Tous les bus</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.company?.name ? `${b.company.name} — ` : ''}
                {b.name} ({b.plateNumber})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">Si Bus est choisi, il prend priorité sur Compagnie.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">PENDING + CONFIRMED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CHECKED_IN">Passagers enregistrés (Check-in)</option>
          </select>
        </div>



        // ... (inside JSX)
        <div className="md:col-span-3 flex gap-3">
          <button
            onClick={handleLoadPreview}
            disabled={previewLoading}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors text-center disabled:opacity-50"
          >
            {previewLoading ? 'Chargement...' : 'Voir la liste'}
          </button>
          <a
            href={downloadUrl}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors text-center"
          >
            Télécharger (CSV)
          </a>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-center disabled:opacity-50"
          >
            {pdfLoading ? 'Génération...' : 'Télécharger (PDF)'}
          </button>
        </div>
      </div>

      {/* Passenger List Block */}
      {bookings.length > 0 && (
        <div className="mt-8 border-t pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Liste des passagers ({bookings.length})
            </h3>
            <span className="text-xs text-gray-500">
              {status === 'CHECKED_IN' ? 'Filtre: Enregistrés uniquement' : 'Filtre: TOUS'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">Siège</th>
                  <th className="px-4 py-3 min-w-[200px]">Passager</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Trajet / Bus</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-black text-primary-600">{b.seatNumber || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.passengerName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.passengerPhone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] font-bold text-gray-900">{b.route}</div>
                      <div className="text-[10px] text-gray-500">{b.busName} ({b.plateNumber})</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.checkedInAt ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-green-600">ENREGISTRÉ</span>
                          <span className="text-[9px] text-gray-400">{new Date(b.checkedInAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 italic">Non enregistré</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {pdfLoading ? 'Génération...' : 'Imprimer cette liste (PDF)'}
            </button>
          </div>
        </div>
      )}

      {bookings.length === 0 && !previewLoading && busId && (
        <div className="mt-8 text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">Aucun passager trouvé pour ces critères.</p>
        </div>
      )}

      <div className="mt-8 border-t pt-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Partager</h3>
            <p className="text-sm text-gray-600">Crée un lien sécurisé (expiration configurable) à envoyer.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 font-semibold">Expire (jours)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white"
            />
            <button
              type="button"
              onClick={handleCreateShareLink}
              disabled={shareLoading}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black disabled:opacity-50"
            >
              {shareLoading ? 'Création...' : 'Créer un lien'}
            </button>
          </div>
        </div>

        {shareError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {shareError}
          </div>
        )}

        {shareUrl && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-2">
              Lien de téléchargement {shareExpiresAt ? `(expire le ${shareExpiresAt})` : ''}
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-xs"
              />
              <button
                type="button"
                onClick={copyShareUrl}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-semibold hover:bg-gray-50"
              >
                Copier
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (optionnel)</label>
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="ex: partenaire@compagnie.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={openMailShare}
                  className="mt-3 w-full px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700"
                >
                  Partager par email
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (optionnel)</label>
                <input
                  value={whatsAppTo}
                  onChange={(e) => setWhatsAppTo(e.target.value)}
                  placeholder="ex: +22501020304"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={openWhatsAppShare}
                  className="mt-3 w-full px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
                >
                  Partager via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

