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

    const meals = await prisma.meal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json({ meals })
  } catch (error) {
    console.error('Admin meals list error:', error)
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
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    const price = Number(body?.price)
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : true

    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const meal = await prisma.meal.create({
      data: {
        name,
        description: description || null,
        price,
        isActive,
      },
    })

    return NextResponse.json({ meal }, { status: 201 })
  } catch (error) {
    console.error('Admin meal create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

