import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFillRateAnalyticsForRange, parseFillRateDateRange } from '@/lib/admin-dashboard-analytics'

function canView(role: string | undefined) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

/**
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — taux de remplissage (trajets partis) sur la plage,
 * avec période de comparaison de même durée juste avant.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !canView(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = parseFillRateDateRange(searchParams.get('from'), searchParams.get('to'))
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const data = await getFillRateAnalyticsForRange(parsed.from, parsed.to)
    return NextResponse.json(data)
  } catch (e) {
    console.error('[fill-rate analytics]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
