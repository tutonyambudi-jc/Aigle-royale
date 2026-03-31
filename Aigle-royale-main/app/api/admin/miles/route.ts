import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeAnnualMilesSummary, DEFAULT_MILES_RULES, type MilesRules, type TripForMiles } from '@/lib/miles'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const qualifyingTrips = Number(searchParams.get('qualifyingTrips') || DEFAULT_MILES_RULES.qualifyingTrips)
    const windowDays = Number(searchParams.get('windowDays') || DEFAULT_MILES_RULES.windowDays)

    const rules: MilesRules = {
      ...DEFAULT_MILES_RULES,
      qualifyingTrips: Number.isFinite(qualifyingTrips) && qualifyingTrips > 0 ? Math.floor(qualifyingTrips) : DEFAULT_MILES_RULES.qualifyingTrips,
      windowDays: Number.isFinite(windowDays) && windowDays > 0 ? Math.floor(windowDays) : DEFAULT_MILES_RULES.windowDays,
    }

    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - rules.windowDays)

    // Bookings payés sur la fenêtre (achat réel)
    const bookings = await prisma.booking.findMany({
      where: {
        payment: {
          status: 'PAID',
          paidAt: { gte: start, lte: now },
        },
        user: { role: 'CLIENT', isActive: true },
      },
      select: {
        userId: true,
        createdAt: true,
        payment: { select: { paidAt: true } },
        trip: { select: { route: { select: { distance: true } } } },
        user: { select: { email: true, firstName: true, lastName: true, loyaltyTier: true } },
      },
      take: 10000,
    })

    const byUser = new Map<
      string,
      { userId: string; email: string; name: string; tier: string; trips: TripForMiles[] }
    >()

    for (const b of bookings) {
      const existing =
        byUser.get(b.userId) ||
        {
          userId: b.userId,
          email: b.user.email,
          name: `${b.user.firstName} ${b.user.lastName}`.trim(),
          tier: b.user.loyaltyTier || 'BRONZE',
          trips: [],
        } as { userId: string; email: string; name: string; tier: string; trips: TripForMiles[] }

      const at = b.payment?.paidAt ? new Date(b.payment.paidAt) : new Date(b.createdAt)
      existing.trips.push({ distanceKm: b.trip.route.distance, at })
      byUser.set(b.userId, existing as any)
    }

    const results = Array.from(byUser.values()).map((u) => {
      const summary = computeAnnualMilesSummary({ trips: u.trips, now, tier: u.tier, rules })
      return {
        userId: u.userId,
        email: u.email,
        name: u.name,
        tier: u.tier,
        ...summary,
      }
    })

    const qualified = results
      .filter((r) => r.qualified)
      .sort((a, b) => b.totalMiles - a.totalMiles)

    return NextResponse.json({
      windowDays: rules.windowDays,
      qualifyingTrips: rules.qualifyingTrips,
      qualifiedCount: qualified.length,
      qualified,
    })
  } catch (error) {
    console.error('Admin miles error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

