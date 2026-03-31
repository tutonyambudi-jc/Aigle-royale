import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
    return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

// GET: Liste de toutes les demandes de location pour l'admin
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }
        if (!isAdminRole(session.user.role)) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let where: any = {}
        if (status) {
            where.status = status
        }

        const rentals = await prisma.busRental.findMany({
            where,
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
                        name: true,
                        plateNumber: true,
                        seatType: true,
                    },
                },
                driver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(rentals)
    } catch (error) {
        console.error('Admin rentals fetch error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
