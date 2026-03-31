import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// DELETE /api/admin/trips/[id] -> Soft delete trip
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.trip.update({
            where: { id: p.id },
            data: { isActive: false },
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: `Erreur suppression: ${error.message || 'Erreur inconnue'}` },
            { status: 500 }
        )
    }
}

// PUT /api/admin/trips/[id] -> Update trip
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const trip = await prisma.trip.update({
            where: { id: p.id },
            data: {
                busId: body.busId,
                routeId: body.routeId,
                departureTime: new Date(body.departureTime),
                arrivalTime: new Date(body.arrivalTime),
                price: Number(body.price),
                promoActive: body.promoActive === true,
                promoMode: typeof body.promoMode === 'string' ? body.promoMode : null,
                promoPrice: body.promoPrice != null ? Number(body.promoPrice) : null,
                promoDays: body.promoDays ? JSON.stringify(body.promoDays) : null,
                boardingMinutesBefore: Number(body.boardingMinutesBefore),
                promotionPercentage: Number(body.promotionPercentage) || 0,
            },
        })
        return NextResponse.json(trip)
    } catch (error: any) {
        return NextResponse.json(
            { error: `Erreur mise à jour: ${error.message || 'Erreur inconnue'}` },
            { status: 500 }
        )
    }
}
