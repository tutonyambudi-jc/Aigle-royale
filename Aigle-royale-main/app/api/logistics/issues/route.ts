import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { freightOrderId, type, description, notes } = await request.json()

        if (!freightOrderId || !type || !description) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
        }

        // Créer le litige et mettre à jour le statut du colis
        const [issue, updatedOrder] = await prisma.$transaction([
            (prisma as any).logisticsIssue.create({
                data: {
                    freightOrderId,
                    type,
                    description,
                    notes: notes || undefined,
                }
            }),
            (prisma.freightOrder.update as any)({
                where: { id: freightOrderId },
                data: {
                    status: 'ISSUE',
                    notes: `Litige signalé (${type}): ${description}`
                }
            })
        ])

        return NextResponse.json({ issue, updatedOrder })
    } catch (error) {
        console.error('Logistics issue creation error:', error)
        return NextResponse.json(
            { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const issues = await (prisma as any).logisticsIssue.findMany({
            include: {
                freightOrder: {
                    include: {
                        trip: {
                            include: {
                                route: true,
                                bus: true
                            }
                        }
                    }
                }
            },
            orderBy: { reportedAt: 'desc' }
        })

        return NextResponse.json(issues)
    } catch (error) {
        console.error('Logistics issues fetch error:', error)
        return NextResponse.json(
            { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
            { status: 500 }
        )
    }
}
