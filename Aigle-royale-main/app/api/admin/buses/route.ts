import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function normalizeAmenities(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function buildSeatNumbersForCapacity(capacity: number, seatsPerRow: number): { rows: number; seatNumbers: string[] } {
  const seatNumbers: string[] = []
  const rows = Math.max(1, Math.ceil(capacity / seatsPerRow))
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r)
    for (let s = 1; s <= seatsPerRow; s++) {
      if (seatNumbers.length >= capacity) break
      seatNumbers.push(`${rowLetter}${s}`)
    }
  }
  return { rows, seatNumbers }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const buses = await prisma.bus.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        _count: { select: { seats: true, trips: true } },
      },
    })

    return NextResponse.json(buses)
  } catch (error) {
    console.error('Admin buses list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : ''
    const plateNumber = typeof body?.plateNumber === 'string' ? body.plateNumber.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const brand = typeof body?.brand === 'string' ? body.brand.trim() : ''
    const seatType = typeof body?.seatType === 'string' ? body.seatType.trim().toUpperCase() : 'STANDARD'
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : null
    const capacity = Number(body?.capacity)
    const amenities = normalizeAmenities(body?.amenities)

    if (!companyName || !plateNumber || !name) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 120) {
      return NextResponse.json({ error: 'Nombre de sièges invalide (1..120)' }, { status: 400 })
    }

    // Siège chauffeur: présent mais non numéroté => pas de Seat pour lui.
    const defaultSeatsPerRow = 5
    const { rows, seatNumbers } = buildSeatNumbersForCapacity(capacity, defaultSeatsPerRow)
    const seatLayout = {
      rows,
      seatsPerRow: defaultSeatsPerRow,
      driverSeat: { present: true, numbered: false },
      numbering: 'A1',
      updatedAt: new Date().toISOString(),
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.busCompany.upsert({
        where: { name: companyName },
        update: {},
        create: { name: companyName },
      })

      const bus = await tx.bus.create({
        data: {
          company: { connect: { id: company.id } },
          plateNumber,
          name,
          brand: brand || null,
          capacity,
          seatLayout: JSON.stringify(seatLayout),
          amenities,
          seatType: seatType === 'VIP' ? 'VIP' : 'STANDARD',
          imageUrl,
          isActive: true,
        },
      })

      await tx.seat.createMany({
        data: seatNumbers.map((seatNumber) => ({
          busId: bus.id,
          seatNumber,
          seatType: bus.seatType,
          isAvailable: true,
        })),
      })

      return bus
    })

    return NextResponse.json({ success: true, busId: result.id }, { status: 201 })
  } catch (error: any) {
    console.error('Admin bus create error:', error)
    // Return detailed error info
    const errorDetails = error?.message || String(error)
    const fullDetails = JSON.stringify(error, Object.getOwnPropertyNames(error))
    return NextResponse.json({ error: `Erreur technique: ${errorDetails} (Details: ${fullDetails})` }, { status: 500 })
  }
}

