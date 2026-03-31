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

    const routes = await prisma.route.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        originCity: true,
        destinationCity: true,
        stops: { include: { stop: { include: { city: true } } }, orderBy: { order: 'asc' } },
        _count: { select: { trips: true } },
      },
    })
    return NextResponse.json(routes)
  } catch (error) {
    console.error('Admin routes list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const originCityId = typeof body?.originCityId === 'string' ? body.originCityId : ''
    const destinationCityId = typeof body?.destinationCityId === 'string' ? body.destinationCityId : ''
    const distance = body?.distance != null ? Number(body.distance) : null
    const duration = body?.duration != null ? Number(body.duration) : null // heures

    if (!originCityId || !destinationCityId) {
      return NextResponse.json({ error: 'Ville de départ et d’arrivée requises' }, { status: 400 })
    }
    if (originCityId === destinationCityId) {
      return NextResponse.json({ error: 'Départ et arrivée doivent être différents' }, { status: 400 })
    }

    const [originCity, destinationCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: originCityId }, select: { id: true, name: true } }),
      prisma.city.findUnique({ where: { id: destinationCityId }, select: { id: true, name: true } }),
    ])

    if (!originCity || !destinationCity) {
      return NextResponse.json({ error: 'Ville introuvable' }, { status: 400 })
    }

    const route = await prisma.route.create({
      data: {
        originCityId,
        destinationCityId,
        origin: originCity.name,
        destination: destinationCity.name,
        distance: distance != null && Number.isFinite(distance) ? distance : null,
        duration: duration != null && Number.isFinite(duration) ? duration : null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, routeId: route.id }, { status: 201 })
  } catch (error) {
    console.error('Admin route create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

