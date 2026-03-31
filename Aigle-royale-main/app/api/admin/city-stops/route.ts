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

    const stops = await prisma.cityStop.findMany({
      where: { isActive: true },
      include: {
        city: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { city: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(stops)
  } catch (error) {
    console.error('Error fetching city stops:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const { cityId, name, address } = body

    if (!cityId || !name) {
      return NextResponse.json({ error: 'Ville et nom requis' }, { status: 400 })
    }

    const cityStop = await prisma.cityStop.create({
      data: {
        cityId,
        name,
        address: address || null,
        isActive: true
      },
      include: {
        city: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(cityStop)
  } catch (error) {
    console.error('Error creating city stop:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
