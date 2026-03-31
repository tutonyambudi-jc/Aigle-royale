import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const stops = await prisma.cityStop.findMany({
      where: { cityId: p.id, isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(stops)
  } catch (error) {
    console.error('Admin city stops list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const address = typeof body?.address === 'string' ? body.address.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim().toUpperCase() : 'BOTH'

    if (!name) return NextResponse.json({ error: 'Nom d’arrêt requis' }, { status: 400 })
    if (!['EMBARK', 'DISEMBARK', 'BOTH'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const stop = await prisma.cityStop.upsert({
      where: { cityId_name: { cityId: p.id, name } },
      update: { isActive: true, address: address || null, type },
      create: { cityId: p.id, name, address: address || null, type },
    })

    return NextResponse.json({ success: true, stopId: stop.id }, { status: 201 })
  } catch (error) {
    console.error('Admin city stop create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

