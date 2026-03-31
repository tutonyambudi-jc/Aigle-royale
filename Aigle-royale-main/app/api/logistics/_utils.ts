import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export function isLogisticsRole(role?: string) {
  return role === 'LOGISTICS' || role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function requireLogisticsSession() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  if (!isLogisticsRole(session.user.role)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 }) }
  }
  return { ok: true as const, session }
}

