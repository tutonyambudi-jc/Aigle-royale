import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const part = randomBytes(4).toString('hex').toUpperCase()
    const code = `BV-${part}`
    const existing = await prisma.travelVoucher.findUnique({ where: { code } })
    if (!existing) return code
  }
  return `BV-${randomBytes(6).toString('hex').toUpperCase()}`
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const vouchers = await prisma.travelVoucher.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        route: { select: { id: true, origin: true, destination: true } },
        trip: {
          select: {
            id: true,
            departureTime: true,
            route: { select: { origin: true, destination: true } },
          },
        },
        booking: { select: { id: true, ticketNumber: true, status: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error('Admin travel vouchers list error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const beneficiaryName = typeof body?.beneficiaryName === 'string' ? body.beneficiaryName.trim() : ''
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const beneficiaryPhone = typeof body?.beneficiaryPhone === 'string' ? body.beneficiaryPhone.trim() : ''
    const beneficiaryEmail = typeof body?.beneficiaryEmail === 'string' ? body.beneficiaryEmail.trim() : ''
    const userId = typeof body?.userId === 'string' && body.userId ? body.userId : null
    const valueAmount = Number(body?.valueAmount)
    const passengerCount = Math.max(1, Math.floor(Number(body?.passengerCount) || 1))
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''
    const routeId = typeof body?.routeId === 'string' && body.routeId ? body.routeId : null
    const tripId = typeof body?.tripId === 'string' && body.tripId ? body.tripId : null
    const issueNow = body?.issueNow !== false
    let validUntil: Date | null = null
    if (typeof body?.validUntil === 'string' && body.validUntil) {
      const d = new Date(body.validUntil)
      if (!Number.isNaN(d.getTime())) validUntil = d
    }

    if (!beneficiaryName || !Number.isFinite(valueAmount) || valueAmount < 0) {
      return NextResponse.json({ error: 'Nom du bénéficiaire et montant valides requis' }, { status: 400 })
    }

    if (tripId && routeId) {
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { routeId: true } })
      if (!trip || trip.routeId !== routeId) {
        return NextResponse.json({ error: 'Le trajet sélectionné ne correspond pas à la ligne' }, { status: 400 })
      }
    }

    if (tripId && !routeId) {
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { routeId: true } })
      if (!trip) return NextResponse.json({ error: 'Trajet introuvable' }, { status: 400 })
    }

    const code = await generateUniqueCode()
    const now = new Date()

    const voucher = await prisma.travelVoucher.create({
      data: {
        code,
        title: title || null,
        beneficiaryName,
        beneficiaryPhone: beneficiaryPhone || null,
        beneficiaryEmail: beneficiaryEmail || null,
        userId,
        valueAmount,
        passengerCount,
        notes: notes || null,
        routeId,
        tripId: tripId || null,
        validUntil,
        status: issueNow ? 'ISSUED' : 'DRAFT',
        issuedAt: issueNow ? now : null,
        createdById: session.user.id,
      },
      include: {
        route: { select: { id: true, origin: true, destination: true } },
        trip: {
          select: {
            id: true,
            departureTime: true,
            route: { select: { origin: true, destination: true } },
          },
        },
      },
    })

    return NextResponse.json({ voucher }, { status: 201 })
  } catch (error) {
    console.error('Admin travel voucher create error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
