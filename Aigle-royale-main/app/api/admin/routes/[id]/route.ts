import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

// GET /api/admin/routes/[id] -> Get route details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const route = await prisma.route.findUnique({
            where: { id: p.id },
            include: {
                originCity: true,
                destinationCity: true
            }
        })

        if (!route) {
            return NextResponse.json({ error: 'Route non trouvée' }, { status: 404 })
        }

        return NextResponse.json(route)
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de la route' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/routes/[id] -> Soft delete route
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.route.update({
            where: { id: p.id },
            data: { isActive: false },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de la route' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/routes/[id] -> Update route
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const originCityId = typeof body?.originCityId === 'string' ? body.originCityId : ''
        const destinationCityId = typeof body?.destinationCityId === 'string' ? body.destinationCityId : ''
        const distance = body?.distance != null ? Number(body.distance) : null
        const duration = body?.duration != null ? Number(body.duration) : null

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

        const route = await prisma.route.update({
            where: { id: p.id },
            data: {
                originCityId,
                destinationCityId,
                origin: originCity.name,
                destination: destinationCity.name,
                distance: distance != null && Number.isFinite(distance) ? distance : null,
                duration: duration != null && Number.isFinite(duration) ? duration : null,
            },
        })
        return NextResponse.json(route)
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de la route' },
            { status: 500 }
        )
    }
}
