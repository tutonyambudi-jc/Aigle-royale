import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
    return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

// PATCH: Toggle seat availability
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; seatId: string }> }
) {
    const p = await params
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }
        if (!isAdminRole(session.user.role)) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
        }

        const { isAvailable } = await request.json()

        if (typeof isAvailable !== 'boolean') {
            return NextResponse.json({ error: 'isAvailable doit être un booléen' }, { status: 400 })
        }

        // Vérifier que le siège appartient bien au bus
        const seat = await prisma.seat.findUnique({
            where: { id: p.seatId },
            select: { id: true, busId: true, seatNumber: true, isAvailable: true },
        })

        if (!seat) {
            return NextResponse.json({ error: 'Siège introuvable' }, { status: 404 })
        }

        if (seat.busId !== p.id) {
            return NextResponse.json({ error: 'Ce siège n\'appartient pas à ce bus' }, { status: 400 })
        }

        // Mettre à jour la disponibilité
        const updatedSeat = await prisma.seat.update({
            where: { id: p.seatId },
            data: { isAvailable },
        })

        return NextResponse.json({
            success: true,
            seat: {
                id: updatedSeat.id,
                seatNumber: updatedSeat.seatNumber,
                isAvailable: updatedSeat.isAvailable,
            },
        })
    } catch (error) {
        console.error('Seat toggle error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}

// PUT: Update seat visibility
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; seatId: string }> }
) {
    const p = await params
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }
        if (!isAdminRole(session.user.role)) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
        }

        const { isHidden } = await request.json()

        if (typeof isHidden !== 'boolean') {
            return NextResponse.json({ error: 'isHidden doit être un booléen' }, { status: 400 })
        }

        // Vérifier que le siège appartient bien au bus
        const seat = await prisma.seat.findUnique({
            where: { id: p.seatId },
            select: { id: true, busId: true, seatNumber: true },
        })

        if (!seat) {
            return NextResponse.json({ error: 'Siège introuvable' }, { status: 404 })
        }

        if (seat.busId !== p.id) {
            return NextResponse.json({ error: 'Ce siège n\'appartient pas à ce bus' }, { status: 400 })
        }

        // Mettre à jour la visibilité
        const updatedSeat = await prisma.seat.update({
            where: { id: p.seatId },
            data: { isHidden },
        })

        return NextResponse.json({
            success: true,
            seat: updatedSeat,
        })
    } catch (error) {
        console.error('Seat visibility update error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
