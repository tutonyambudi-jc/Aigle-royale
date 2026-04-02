import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const raw = body?.freightPricePerKg
    if (raw === undefined) {
      return NextResponse.json({ error: 'freightPricePerKg requis' }, { status: 400 })
    }
    const freightPricePerKg = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
    if (Number.isNaN(freightPricePerKg) || freightPricePerKg < 0) {
      return NextResponse.json({ error: 'Prix au kg invalide (nombre ≥ 0)' }, { status: 400 })
    }

    const updated = await prisma.busCompany.update({
      where: { id },
      data: { freightPricePerKg },
      select: { id: true, name: true, freightPricePerKg: true },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH admin company:', e)
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }
}
