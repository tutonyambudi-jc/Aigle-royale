'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'CONFIRMED', label: 'Confirmées' },
  { id: 'CANCELLED', label: 'Annulées' },
] as const

const WHEN_FILTERS = [
  { id: 'future', label: 'Trajets à venir' },
  { id: 'past', label: 'Trajets passés' },
  { id: 'all', label: 'Tous les trajets' },
] as const

const MAX_Q = 80

export function AdminBookingsToolbar({
  currentStatus,
  currentWhen,
  initialQuery,
}: {
  currentStatus: string
  currentWhen: string
  initialQuery: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQuery)

  useEffect(() => {
    setQ(initialQuery)
  }, [initialQuery])

  const pushParams = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(searchParams.toString())
    mutate(p)
    router.push(`/admin/bookings?${p.toString()}`)
  }

  const setStatus = (id: string) => {
    pushParams((p) => {
      if (id === 'all') p.delete('status')
      else p.set('status', id)
      p.set('page', '1')
    })
  }

  const setWhen = (id: string) => {
    pushParams((p) => {
      if (id === 'future') p.delete('when')
      else p.set('when', id)
      p.set('page', '1')
    })
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim().slice(0, MAX_Q)
    setQ(trimmed)
    pushParams((p) => {
      if (trimmed) p.set('q', trimmed)
      else p.delete('q')
      p.set('page', '1')
    })
  }

  const clearSearch = () => {
    setQ('')
    pushParams((p) => {
      p.delete('q')
      p.set('page', '1')
    })
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Période du trajet">
        {WHEN_FILTERS.map((f) => {
          const active =
            (f.id === 'future' && currentWhen === 'future') ||
            (f.id === 'past' && currentWhen === 'past') ||
            (f.id === 'all' && currentWhen === 'all')
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setWhen(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                active
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor="admin-bookings-q" className="sr-only">
          Recherche par billet, téléphone ou nom
        </label>
        <div className="relative flex-1 min-w-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            id="admin-bookings-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, MAX_Q))}
            placeholder="N° billet, téléphone, nom passager…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            autoComplete="off"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Rechercher
          </button>
          {(initialQuery || q.trim()) && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Effacer
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((f) => {
          const active = (f.id === 'all' && currentStatus === 'all') || f.id === currentStatus
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
