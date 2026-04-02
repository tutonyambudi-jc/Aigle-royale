import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Suspense } from 'react'
import { BookingActionButtons } from '@/components/admin/BookingActionButtons'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { AdminBookingsToolbar } from '@/components/admin/AdminBookingsFilters'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const

function statusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return {
        className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
        label: 'Confirmée',
      }
    case 'PENDING':
      return {
        className: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
        label: 'En attente',
      }
    case 'CANCELLED':
      return {
        className: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
        label: 'Annulée',
      }
    default:
      return {
        className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        label: status,
      }
  }
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  const page = Number(sp.page) || 1
  const limit = Number(sp.limit) || 20
  const skip = (page - 1) * limit

  const now = new Date()

  const rawStatus = typeof sp.status === 'string' ? sp.status : 'all'
  const statusFilter =
    rawStatus !== 'all' && VALID_STATUSES.includes(rawStatus as (typeof VALID_STATUSES)[number])
      ? rawStatus
      : undefined

  const rawWhen = typeof sp.when === 'string' ? sp.when : 'future'
  const whenFilter = ['future', 'past', 'all'].includes(rawWhen) ? rawWhen : 'future'

  const qRaw = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''

  const futureTrip = {
    departureTime: { gte: now },
  }

  const parts: Prisma.BookingWhereInput[] = []
  if (statusFilter) {
    parts.push({ status: statusFilter })
  }
  if (whenFilter === 'future') {
    parts.push({ trip: { is: { departureTime: { gte: now } } } })
  } else if (whenFilter === 'past') {
    parts.push({ trip: { is: { departureTime: { lt: now } } } })
  }

  if (qRaw) {
    const orSearch: Prisma.BookingWhereInput[] = [
      { ticketNumber: { contains: qRaw } },
      { passengerPhone: { contains: qRaw } },
      { passengerName: { contains: qRaw } },
      { qrCode: { contains: qRaw } },
    ]
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidLike.test(qRaw)) {
      orSearch.push({ id: qRaw })
    }
    parts.push({ OR: orSearch })
  }

  const baseWhere: Prisma.BookingWhereInput =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts }

  const [
    bookings,
    totalBookings,
    countPending,
    countConfirmed,
    countCancelled,
    countAllFuture,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        trip: {
          include: {
            route: true,
          },
        },
        travelVoucher: {
          select: {
            code: true,
            status: true,
          },
        },
      },
    }),
    prisma.booking.count({ where: baseWhere }),
    prisma.booking.count({
      where: { trip: futureTrip, status: 'PENDING' },
    }),
    prisma.booking.count({
      where: { trip: futureTrip, status: 'CONFIRMED' },
    }),
    prisma.booking.count({
      where: { trip: futureTrip, status: 'CANCELLED' },
    }),
    prisma.booking.count({
      where: { trip: futureTrip },
    }),
  ])

  const currentFilterLabel = statusFilter ?? 'all'

  const whenDescription =
    whenFilter === 'future'
      ? 'trajets à venir'
      : whenFilter === 'past'
        ? 'trajets déjà partis'
        : 'tous les trajets'

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primary-50/30 px-6 py-8 sm:px-10 mb-8 shadow-sm">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-sky-100/30 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4 max-w-2xl">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">Opérations</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Gérer les réservations</h1>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Validation et suivi des ventes de billets. Filtrez par période de départ, statut, ou recherchez un billet
                / un passager.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Les indicateurs ci-dessous concernent toujours les <strong className="text-slate-700">trajets à venir</strong>{' '}
                (vue opérationnelle), indépendamment des filtres de la liste.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            <span aria-hidden>←</span> Retour tableau de bord
          </Link>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">À venir (tous statuts)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{countAllFuture}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800/80">En attente</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-950">{countPending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">Confirmées</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">{countConfirmed}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-800/80">Annulées</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-950">{countCancelled}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Suspense
          fallback={<div className="h-40 w-full max-w-5xl rounded-xl bg-slate-100 animate-pulse" />}
        >
          <AdminBookingsToolbar
            currentStatus={currentFilterLabel}
            currentWhen={whenFilter}
            initialQuery={qRaw}
          />
        </Suspense>
        <p className="text-sm text-slate-500 shrink-0 lg:text-right lg:pt-1">
          <span className="font-semibold text-slate-700">{totalBookings}</span> résultat
          {totalBookings > 1 ? 's' : ''}
          <span className="block text-xs mt-1 text-slate-400">Vue : {whenDescription}</span>
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">Liste des réservations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tri par date de réservation (plus récent en premier). Recherche sur n° de billet, téléphone, nom, code QR ou
            identifiant réservation.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center px-6 py-20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucune réservation</h3>
            <p className="mt-2 text-slate-500 max-w-md mx-auto">
              Aucun billet ne correspond aux critères ({whenDescription}
              {qRaw ? ` · recherche « ${qRaw} »` : ''}). Élargissez la période (ex. « Tous les trajets »), le statut, ou
              modifiez la recherche.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 lg:px-8">Référence</th>
                    <th className="px-6 py-4">Passager</th>
                    <th className="px-6 py-4">Trajet</th>
                    <th className="px-6 py-4">Départ</th>
                    <th className="px-6 py-4">Montant</th>
                    <th className="px-6 py-4">Bon voyage</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                    <th className="px-6 py-4 text-right lg:pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const badge = statusBadge(booking.status)
                    const total = Number(booking.totalPrice ?? booking.trip.price)
                    const discount = Number(booking.discountAmount ?? 0)
                    const dep = new Date(booking.trip.departureTime)
                    const tripIsPast = dep.getTime() < now.getTime()
                    return (
                      <tr key={booking.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 lg:px-8 align-top">
                          <span className="font-mono text-xs font-semibold text-slate-600">
                            #{booking.ticketNumber || booking.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-slate-900">{booking.passengerName}</div>
                          {booking.passengerPhone && (
                            <div className="text-xs text-slate-500 mt-0.5">{booking.passengerPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-medium text-slate-800">
                            {booking.trip.route.origin}
                            <span className="mx-1.5 text-slate-300">→</span>
                            {booking.trip.route.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {dep.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {dep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {tripIsPast && (
                            <span className="mt-1 inline-block rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              Passé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-slate-900">{formatCurrency(total, currency)}</div>
                          {discount > 0 && (
                            <div className="text-xs text-emerald-700 mt-0.5">−{formatCurrency(discount, currency)} réduction</div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {booking.travelVoucher ? (
                            <div>
                              <span className="inline-block rounded-lg bg-sky-50 px-2 py-1 font-mono text-xs font-medium text-sky-900 ring-1 ring-sky-100">
                                {booking.travelVoucher.code}
                              </span>
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">
                                {booking.travelVoucher.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-right lg:pr-8">
                          <BookingActionButtons bookingId={booking.id} status={booking.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <ul className="lg:hidden divide-y divide-slate-100">
              {bookings.map((booking) => {
                const badge = statusBadge(booking.status)
                const total = Number(booking.totalPrice ?? booking.trip.price)
                const discount = Number(booking.discountAmount ?? 0)
                const dep = new Date(booking.trip.departureTime)
                const tripIsPast = dep.getTime() < now.getTime()
                return (
                  <li key={booking.id} className="p-5 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-slate-500">#{booking.ticketNumber || booking.id.slice(0, 8)}</p>
                        <p className="mt-1 font-semibold text-slate-900">{booking.passengerName}</p>
                        {booking.passengerPhone && (
                          <p className="text-sm text-slate-500">{booking.passengerPhone}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-800">
                      <span className="font-medium">{booking.trip.route.origin}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="font-medium">{booking.trip.route.destination}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span>
                        Départ :{' '}
                        {dep.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {tripIsPast && (
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          Passé
                        </span>
                      )}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-lg font-bold text-slate-900">{formatCurrency(total, currency)}</span>
                        {discount > 0 && (
                          <span className="ml-2 text-xs text-emerald-700">−{formatCurrency(discount, currency)}</span>
                        )}
                      </div>
                      {booking.travelVoucher && (
                        <span className="rounded-md bg-sky-50 px-2 py-1 font-mono text-xs text-sky-900 ring-1 ring-sky-100">
                          {booking.travelVoucher.code}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                      <BookingActionButtons bookingId={booking.id} status={booking.status} />
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-slate-100 px-6 py-4 sm:px-8 bg-slate-50/50">
              <PaginationControls totalItems={totalBookings} currentLimit={limit} currentPage={page} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
