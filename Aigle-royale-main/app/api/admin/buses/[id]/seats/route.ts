import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function buildSeatNumbers(rows: number, seatsPerRow: number): string[] {
  const seatNumbers: string[] = []
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r) // A, B, C...
    for (let s = 1; s <= seatsPerRow; s++) {
      seatNumbers.push(`${rowLetter}${s}`)
    }
  }
  return seatNumbers
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const rows = Number(body?.rows)
    const seatsPerRow = Number(body?.seatsPerRow)

    if (!p.id) {
      return NextResponse.json({ error: 'Bus manquant' }, { status: 400 })
    }
    if (!Number.isFinite(rows) || rows < 1 || rows > 26) {
      return NextResponse.json({ error: 'rows invalide (1..26)' }, { status: 400 })
    }
    if (!Number.isFinite(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 15) {
      return NextResponse.json({ error: 'seatsPerRow invalide (1..15)' }, { status: 400 })
    }

    const bus = await prisma.bus.findUnique({
      where: { id: p.id },
      select: { id: true, seatType: true },
    })
    if (!bus) {
      return NextResponse.json({ error: 'Bus introuvable' }, { status: 404 })
    }

    // Siège chauffeur: présent dans le plan, mais PAS numéroté => pas de ligne `Seat` pour lui.
    const passengerSeatNumbers = buildSeatNumbers(rows, seatsPerRow)
    const passengerCapacity = passengerSeatNumbers.length

    const seatLayout = {
      rows,
      seatsPerRow,
      driverSeat: { present: true, numbered: false },
      numbering: 'A1',
      updatedAt: new Date().toISOString(),
    }

    await prisma.$transaction(async (tx) => {
      // Remplacer toute la configuration des sièges passagers pour ce bus
      await tx.seat.deleteMany({ where: { busId: bus.id } })

      await tx.seat.createMany({
        data: passengerSeatNumbers.map((seatNumber) => ({
          busId: bus.id,
          seatNumber,
          seatType: bus.seatType || 'STANDARD',
          isAvailable: true,
        })),
      })

      await tx.bus.update({
        where: { id: bus.id },
        data: {
          capacity: passengerCapacity,
          seatLayout: JSON.stringify(seatLayout),
        },
      })
    })

    return NextResponse.json({
      success: true,
      passengerCapacity,
      seatLayout,
    })
  } catch (error) {
    console.error('Admin seat configure error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

