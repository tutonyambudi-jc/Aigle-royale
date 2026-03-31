import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcBaggageExtrasXof } from '@/lib/baggage'

const WIFI_PASS_PRICE_FC = (() => {
  const raw = process.env.NEXT_PUBLIC_WIFI_PASS_PRICE_FC
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n >= 0 ? n : 1000
})()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: {
        trip: true,
        payment: true,
      },
    })
    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Les services à bord ne sont modifiables que pour une réservation en attente' }, { status: 400 })
    }
    if (booking.payment?.status === 'PAID') {
      return NextResponse.json({ error: 'Réservation déjà payée' }, { status: 400 })
    }

    const body = await request.json()
    const mealId = typeof body?.mealId === 'string' ? body.mealId : null
    const wifiPass = typeof body?.wifiPass === 'boolean' ? body.wifiPass : false
    const extraBaggagePieces = Number(body?.extraBaggagePieces)
    const extraBaggageOverweightKg = Number(body?.extraBaggageOverweightKg)

    let mealPrice = 0
    if (mealId) {
      const meal = await prisma.meal.findUnique({
        where: { id: mealId },
        select: { id: true, price: true, isActive: true },
      })
      if (!meal || !meal.isActive) {
        return NextResponse.json({ error: 'Repas invalide' }, { status: 400 })
      }
      mealPrice = meal.price
    }

    const baggageExtras = calcBaggageExtrasXof({
      extraPieces: extraBaggagePieces,
      overweightKg: extraBaggageOverweightKg,
    })
    const extrasTotal = mealPrice + (wifiPass ? WIFI_PASS_PRICE_FC : 0) + baggageExtras
    const totalPrice = booking.trip.price + extrasTotal

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        mealId,
        wifiPass,
        extraBaggagePieces: Number.isFinite(extraBaggagePieces) ? Math.max(0, Math.floor(extraBaggagePieces)) : 0,
        extraBaggageOverweightKg: Number.isFinite(extraBaggageOverweightKg) ? Math.max(0, extraBaggageOverweightKg) : 0,
        extrasTotal,
        totalPrice,
      },
      select: {
        id: true,
        mealId: true,
        wifiPass: true,
        extraBaggagePieces: true,
        extraBaggageOverweightKg: true,
        extrasTotal: true,
        totalPrice: true,
      },
    })

    return NextResponse.json({ booking: updated, wifiPrice: WIFI_PASS_PRICE_FC })
  } catch (error) {
    console.error('Booking extras update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

