import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
    return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

// GET: Détails d'une demande de location
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const rental = await prisma.busRental.findUnique({
            where: { id: p.id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                },
                bus: {
                    select: {
                        id: true,
                        name: true,
                        plateNumber: true,
                        seatType: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
        })

        if (!rental) {
            return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
        }

        return NextResponse.json(rental)
    } catch (error) {
        console.error('Admin rental details error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}

// PATCH: Mettre à jour le statut, l'attribution ou le prix d'une location
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const body = await request.json()
        const {
            status,
            busId,
            driverId,
            finalPrice,
            adminNotes,
            rejectionReason,
            paymentStatus
        } = body

        // Vérifier l'existence de la location
        const rental = await prisma.busRental.findUnique({
            where: { id: p.id }
        })

        if (!rental) {
            return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
        }

        // Mettre à jour
        const updatedRental = await prisma.busRental.update({
            where: { id: p.id },
            data: {
                status: status || undefined,
                busId: busId || undefined,
                driverId: driverId || undefined,
                finalPrice: finalPrice !== undefined ? finalPrice : undefined,
                adminNotes: adminNotes || undefined,
                rejectionReason: rejectionReason || undefined,
                paymentStatus: paymentStatus || undefined,
            },
            include: {
                bus: true,
                driver: true
            }
        })

        return NextResponse.json({
            success: true,
            rental: updatedRental
        })
    } catch (error) {
        console.error('Admin rental update error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
