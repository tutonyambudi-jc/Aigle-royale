import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export type ManifestStatus = 'ALL' | 'CONFIRMED' | 'PENDING' | 'CHECKED_IN'

export type PassengerManifestParams = {
  from: Date
  to: Date
  companyId?: string
  busId?: string
  tripId?: string
  status?: ManifestStatus
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function safeFilePart(v: string): string {
  return v.trim().replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'all'
}

export async function getPassengerManifestData(params: PassengerManifestParams) {
  const start = new Date(params.from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(params.to)
  end.setHours(23, 59, 59, 999)

  const status = (params.status || 'ALL').toUpperCase() as ManifestStatus

  const where: any = {
    trip: {
      departureTime: {
        gte: start,
        lte: end,
      },
    },
  }

  if (status === 'CHECKED_IN') {
    where.checkedInAt = { not: null }
  } else if (status !== 'ALL') {
    where.status = status
  } else {
    where.status = { in: ['CONFIRMED', 'PENDING'] }
  }

  if (params.tripId) where.tripId = params.tripId
  if (params.busId) {
    where.trip = {
      ...where.trip,
      busId: params.busId
    }
  } else if (params.companyId) {
    where.trip = {
      ...where.trip,
      bus: { companyId: params.companyId }
    }
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ trip: { departureTime: 'asc' } }, { createdAt: 'asc' }],
    include: {
      seat: true,
      payment: true,
      trip: {
        include: {
          route: true,
          bus: {
            include: {
              company: true,
              drivers: { where: { isActive: true } }
            }
          },
        },
      },
    },
  })

  return { bookings, start, end }
}

export async function buildPassengerManifestCsv(params: PassengerManifestParams): Promise<{
  csv: string
  filename: string
  rows: number
}> {
  const { bookings, start, end } = await getPassengerManifestData(params)

  const header = [
    'Compagnie',
    'Bus',
    'Chauffeur(s)',
    'Plaque',
    'TripId',
    'Trajet',
    'Départ',
    'Arrivée',
    'Siège',
    'Passager',
    'Genre',
    'Téléphone',
    'Email',
    'Adresse',
    'Statut réservation',
    'N° billet',
    'Statut paiement',
    'Méthode paiement',
  ]

  const lines: string[] = []
  // UTF-8 BOM for Excel
  lines.push('\ufeff' + header.map(csvEscape).join(','))

  for (const b of bookings) {
    const companyName = b.trip.bus.company?.name || '—'
    const busName = b.trip.bus.name || '—'
    const plate = b.trip.bus.plateNumber || '—'
    const drivers = b.trip.bus.drivers.map(d => `${d.firstName} ${d.lastName}`).join(' / ') || '—'
    const routeLabel = `${b.trip.route.origin} → ${b.trip.route.destination}`
    const depart = format(new Date(b.trip.departureTime), 'yyyy-MM-dd HH:mm')
    const arrive = format(new Date(b.trip.arrivalTime), 'yyyy-MM-dd HH:mm')

    lines.push(
      [
        companyName,
        busName,
        drivers,
        plate,
        b.tripId,
        routeLabel,
        depart,
        arrive,
        b.seat?.seatNumber || '',
        b.passengerName,
        b.passengerGender || '',
        b.passengerPhone || '',
        b.passengerEmail || '',
        b.passengerAddress || '',
        b.status,
        b.ticketNumber,
        b.payment?.status || 'PENDING',
        b.payment?.method || '—',
      ].map(csvEscape).join(',')
    )
  }

  const datePart = `${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}`
  const companyPart = params.companyId ? safeFilePart(bookings[0]?.trip?.bus?.company?.name || params.companyId) : 'all_companies'
  const busPart = params.busId ? safeFilePart(bookings[0]?.trip?.bus?.plateNumber || params.busId) : 'all_buses'
  const filename = `manifest_passagers_${companyPart}_${busPart}_${datePart}.csv`

  return { csv: lines.join('\r\n'), filename, rows: bookings.length }
}

