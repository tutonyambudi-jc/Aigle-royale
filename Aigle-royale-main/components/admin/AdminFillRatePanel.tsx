'use client'

import { useCallback, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type {
  FillRateAnalyticsResult,
  FillRateBreakdownRow,
  FillRatePeriodMeta,
} from '@/lib/admin-dashboard-analytics'

type Tab = 'global' | 'company' | 'route'

function isoDateInput(iso: string) {
  return iso.slice(0, 10)
}

function fmtIsoShort(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy 'à' HH:mm", { locale: fr })
  } catch {
    return iso.slice(0, 16)
  }
}

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function presetInclusiveDays(n: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (n - 1))
  return { from: toYMD(from), to: toYMD(to) }
}

function escapeCsvCell(v: string | number | null | undefined) {
  if (v === null || v === undefined) return ''
  const t = String(v)
  if (/[;"\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

function GrowthBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-gray-500 font-medium">= 0 pt</span>
  }
  const up = delta > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${up ? 'text-emerald-600' : 'text-rose-600'}`}
    >
      {up ? '↑' : '↓'} {up ? '+' : ''}
      {delta.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} pts
    </span>
  )
}

function RowGrowth({ row }: { row: FillRateBreakdownRow }) {
  if (row.growthDeltaPoints === null) {
    return <span className="text-gray-400 text-xs">—</span>
  }
  return <GrowthBadge delta={row.growthDeltaPoints} />
}

function buildCsv(data: FillRateAnalyticsResult) {
  const { period, fillRateByCompany, fillRateByRoute, fillRatePercent, fillTripCount, totalOccupiedSeats, totalCapacitySeats } =
    data
  const lines: string[] = []
  lines.push('Section;Valeur')
  lines.push(`Taux global (%);${escapeCsvCell(fillRatePercent)}`)
  lines.push(`Sièges occupés;${escapeCsvCell(totalOccupiedSeats)}`)
  lines.push(`Capacité totale;${escapeCsvCell(totalCapacitySeats)}`)
  lines.push(`Nombre de trajets;${escapeCsvCell(fillTripCount)}`)
  lines.push(`Période courante (début);${escapeCsvCell(period.currentFrom)}`)
  lines.push(`Période courante (fin);${escapeCsvCell(period.currentTo)}`)
  lines.push(`Période comparaison (début);${escapeCsvCell(period.previousFrom)}`)
  lines.push(`Période comparaison (fin);${escapeCsvCell(period.previousTo)}`)
  lines.push('')
  lines.push('Par compagnie')
  lines.push('Compagnie;Trajets;Occupés;Capacité;Taux %;Croissance (pts)')
  for (const r of fillRateByCompany) {
    lines.push(
      [
        r.label,
        r.tripCount,
        r.totalOccupied,
        r.totalCapacity,
        r.fillRatePercent,
        r.growthDeltaPoints ?? '',
      ]
        .map(escapeCsvCell)
        .join(';')
    )
  }
  lines.push('')
  lines.push('Par ligne')
  lines.push('Ligne;Trajets;Occupés;Capacité;Taux %;Croissance (pts)')
  for (const r of fillRateByRoute) {
    lines.push(
      [
        r.label,
        r.tripCount,
        r.totalOccupied,
        r.totalCapacity,
        r.fillRatePercent,
        r.growthDeltaPoints ?? '',
      ]
        .map(escapeCsvCell)
        .join(';')
    )
  }
  return '\uFEFF' + lines.join('\r\n')
}

export function AdminFillRatePanel({
  fillRatePercent: initialFill,
  fillTripCount: initialTrips,
  totalCapacitySeats: initialCap,
  totalOccupiedSeats: initialOcc,
  fillRateGlobalGrowth: initialGrowth,
  fillRateByCompany: initialCo,
  fillRateByRoute: initialRt,
  fillPeriod: initialPeriod,
}: {
  fillRatePercent: number
  fillTripCount: number
  totalCapacitySeats: number
  totalOccupiedSeats: number
  fillRateGlobalGrowth: FillRateAnalyticsResult['fillRateGlobalGrowth']
  fillRateByCompany: FillRateBreakdownRow[]
  fillRateByRoute: FillRateBreakdownRow[]
  fillPeriod: FillRatePeriodMeta
}) {
  const [tab, setTab] = useState<Tab>('global')
  const [data, setData] = useState<FillRateAnalyticsResult>(() => ({
    fillRatePercent: initialFill,
    fillTripCount: initialTrips,
    totalCapacitySeats: initialCap,
    totalOccupiedSeats: initialOcc,
    fillRateGlobalGrowth: initialGrowth,
    fillRateByCompany: initialCo,
    fillRateByRoute: initialRt,
    period: initialPeriod,
  }))
  const [fromInput, setFromInput] = useState(() => isoDateInput(initialPeriod.currentFrom))
  const [toInput, setToInput] = useState(() => isoDateInput(initialPeriod.currentTo))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyFetch = useCallback(
    async (from: string, to: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics/fill-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        const json = await res.json()
        if (!res.ok) {
          setError(typeof json.error === 'string' ? json.error : 'Erreur lors du chargement')
          return
        }
        setData(json as FillRateAnalyticsResult)
        setFromInput(isoDateInput((json as FillRateAnalyticsResult).period.currentFrom))
        setToInput(isoDateInput((json as FillRateAnalyticsResult).period.currentTo))
      } catch {
        setError('Réseau indisponible')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const onApply = () => applyFetch(fromInput, toInput)

  const onPreset = (days: number) => {
    const { from, to } = presetInclusiveDays(days)
    setFromInput(from)
    setToInput(to)
    void applyFetch(from, to)
  }

  const downloadCsv = () => {
    const csv = buildCsv(data)
    const a = document.createElement('a')
    const from = isoDateInput(data.period.currentFrom)
    const to = isoDateInput(data.period.currentTo)
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `remplissage_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const periodHint = useMemo(() => {
    const p = data.period
    return `${fmtIsoShort(p.currentFrom)} — ${fmtIsoShort(p.currentTo)}`
  }, [data.period])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'global', label: 'Vue globale' },
    { id: 'company', label: 'Par compagnie' },
    { id: 'route', label: 'Par ligne' },
  ]

  const g = data.fillRateGlobalGrowth

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow border border-indigo-100 overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-indigo-100/80 bg-white/70 space-y-3">
        <div className="flex flex-wrap items-end gap-2 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold uppercase text-indigo-800/80">Du</label>
            <input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="text-sm rounded-lg border border-indigo-200 px-2 py-1.5 bg-white text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold uppercase text-indigo-800/80">Au</label>
            <input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="text-sm rounded-lg border border-indigo-200 px-2 py-1.5 bg-white text-gray-900"
            />
          </div>
          <button
            type="button"
            onClick={() => void onApply()}
            disabled={loading}
            className="mt-5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '…' : 'Appliquer'}
          </button>
          <div className="flex flex-wrap gap-1 mt-5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onPreset(d)}
                disabled={loading}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-900 hover:bg-indigo-200 disabled:opacity-50"
              >
                {d} j.
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="mt-5 ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-300 text-indigo-900 hover:bg-indigo-50"
          >
            Export CSV
          </button>
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        <p className="text-[11px] text-indigo-800/70">
          Plage max. 366 j. · Comparaison : période de <strong>même durée</strong> juste avant le « Du ». Dates en UTC
          (champ date).
        </p>
      </div>

      <div className="flex flex-wrap gap-1 p-2 border-b border-indigo-100/80 bg-white/60">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-900/70 hover:bg-indigo-100/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'global' && (
          <div>
            <p className="text-xs text-indigo-700/80 mb-3">
              Trajets déjà partis sur la période : <span className="font-medium">{periodHint}</span> (sièges vendus non
              annulés / capacité des bus). Comparaison avec la fenêtre précédente de même durée.
            </p>
            <div className="flex flex-wrap items-end gap-3 mb-2">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-indigo-900">{data.fillRatePercent}</span>
                <span className="text-xl font-bold text-indigo-600 mb-1">%</span>
              </div>
              <div className="pb-1 text-sm border-l border-indigo-200 pl-4 ml-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Évolution vs période précédente</div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-gray-600">
                    {g.previousFillRate.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })}
                    % →{' '}
                    {data.fillRatePercent.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                  <GrowthBadge delta={g.deltaPoints} />
                </div>
              </div>
            </div>
            <div className="mt-3 h-3 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, data.fillRatePercent)}%` }}
              />
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="rounded-lg bg-white/80 border border-indigo-100/60 p-3">
                <div className="font-semibold text-indigo-900 mb-1">Période analysée</div>
                <div>
                  Sièges : <strong>{data.totalOccupiedSeats}</strong> / <strong>{data.totalCapacitySeats}</strong> ·
                  Trajets : <strong>{data.fillTripCount}</strong>
                </div>
              </div>
              <div className="rounded-lg bg-white/80 border border-indigo-100/60 p-3">
                <div className="font-semibold text-gray-700 mb-1">Période de comparaison</div>
                <div>
                  Sièges : <strong>{g.previousOccupied}</strong> / <strong>{g.previousCapacity}</strong> · Trajets :{' '}
                  <strong>{g.previousTripCount}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'company' && (
          <div>
            <p className="text-xs text-indigo-700/80 mb-4">
              Taux par compagnie (bus affecté). <em>Croissance</em> : même compagnie, période de comparaison
              immédiatement avant votre plage.
            </p>
            {data.fillRateByCompany.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Aucun trajet analysé sur cette période.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-indigo-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="pb-2 pr-3">Compagnie</th>
                      <th className="pb-2 pr-3">Trajets</th>
                      <th className="pb-2 pr-3">Occupés / capacité</th>
                      <th className="pb-2 pr-3">Taux</th>
                      <th className="pb-2">Croissance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fillRateByCompany.map((row) => (
                      <tr key={row.id ?? 'none'} className="border-b border-indigo-50/80 last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-gray-900">{row.label}</td>
                        <td className="py-2.5 pr-3 text-gray-700">{row.tripCount}</td>
                        <td className="py-2.5 pr-3 text-gray-700">
                          {row.totalOccupied} / {row.totalCapacity}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-indigo-800">
                          {row.fillRatePercent.toLocaleString('fr-FR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          })}
                          %
                        </td>
                        <td className="py-2.5">
                          <RowGrowth row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'route' && (
          <div>
            <p className="text-xs text-indigo-700/80 mb-4">Taux par ligne (origine → destination).</p>
            {data.fillRateByRoute.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Aucun trajet analysé sur cette période.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-indigo-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="pb-2 pr-3">Ligne</th>
                      <th className="pb-2 pr-3">Trajets</th>
                      <th className="pb-2 pr-3">Occupés / capacité</th>
                      <th className="pb-2 pr-3">Taux</th>
                      <th className="pb-2">Croissance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fillRateByRoute.map((row) => (
                      <tr key={row.id ?? 'unknown'} className="border-b border-indigo-50/80 last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-gray-900">{row.label}</td>
                        <td className="py-2.5 pr-3 text-gray-700">{row.tripCount}</td>
                        <td className="py-2.5 pr-3 text-gray-700">
                          {row.totalOccupied} / {row.totalCapacity}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-indigo-800">
                          {row.fillRatePercent.toLocaleString('fr-FR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          })}
                          %
                        </td>
                        <td className="py-2.5">
                          <RowGrowth row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
