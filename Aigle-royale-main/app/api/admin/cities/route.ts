import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        stops: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
    })
    return NextResponse.json(cities)
  } catch (error) {
    console.error('Admin cities list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Nom de ville requis' }, { status: 400 })

    const city = await prisma.city.upsert({
      where: { name },
      update: { isActive: true },
      create: { name },
    })

    return NextResponse.json({ success: true, cityId: city.id }, { status: 201 })
  } catch (error) {
    console.error('Admin city create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

