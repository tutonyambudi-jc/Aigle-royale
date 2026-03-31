import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { format } from 'date-fns'
import { buildPassengerManifestCsv } from '@/lib/manifests/passengers'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function parseYmdToLocalDate(ymd: string | null): Date | null {
  if (!ymd) return null
  const parts = ymd.split('-').map((x) => Number(x))
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(year, month - 1, day)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const url = new URL(request.url)
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')
    const companyId = url.searchParams.get('companyId') || ''
    const busId = url.searchParams.get('busId') || ''
    const tripId = url.searchParams.get('tripId') || ''
    const status = (url.searchParams.get('status') || 'ALL').toUpperCase()
    const formatType = url.searchParams.get('format') || 'csv'

    const from = parseYmdToLocalDate(fromParam) || new Date(new Date().setHours(0, 0, 0, 0))
    const to = parseYmdToLocalDate(toParam) || from

    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)

    // Si format=json, on retourne les données brutes
    if (formatType === 'json') {
      const { getPassengerManifestData } = await import('@/lib/manifests/passengers')
      const { bookings } = await getPassengerManifestData({
        from: start,
        to: end,
        companyId: companyId || undefined,
        busId: busId || undefined,
        tripId: tripId || undefined,
        status: (status as any) || 'ALL',
      })

      // On formate un peu pour le client
      const data = bookings.map((b: any) => ({
        companyName: b.trip.bus.company?.name || '—',
        busName: b.trip.bus.name || '—',
        plateNumber: b.trip.bus.plateNumber || '—',
        drivers: b.trip.bus.drivers.map((d: any) => `${d.firstName} ${d.lastName}`).join(' / ') || '—',
        route: `${b.trip.route.origin} → ${b.trip.route.destination}`,
        departureTime: b.trip.departureTime,
        arrivalTime: b.trip.arrivalTime,
        seatNumber: b.seat?.seatNumber || '',
        passengerName: b.passengerName,
        passengerPhone: b.passengerPhone || '',
        ticketNumber: b.ticketNumber,
        status: b.status,
        checkedInAt: b.checkedInAt,
        checkInNotes: b.checkInNotes,
      }))

      return NextResponse.json({ bookings: data })
    }

    const { csv, filename } = await buildPassengerManifestCsv({
      from: start,
      to: end,
      companyId: companyId || undefined,
      busId: busId || undefined,
      tripId: tripId || undefined,
      status: (status as any) || 'ALL',
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Admin passenger manifest error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

