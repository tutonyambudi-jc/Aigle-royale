import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        const freightOrders = await (prisma.freightOrder.findMany as any)({
            include: {
                trip: {
                    include: {
                        route: true,
                        bus: {
                            select: { name: true, plateNumber: true }
                        }
                    }
                },
                user: {
                    select: { firstName: true, lastName: true, email: true, phone: true }
                },
                payment: true,
                originStop: { include: { city: true } },
                destinationStop: { include: { city: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(freightOrders)
    } catch (error) {
        console.error('Admin freight fetch error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
