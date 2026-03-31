import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Vérifier la disponibilité des bus
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { startDate, endDate, busType } = body

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Dates requises' }, { status: 400 })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        // Récupérer tous les bus actifs
        let busQuery: any = {
            isActive: true,
        }

        if (busType) {
            busQuery.seatType = busType
        }

        const buses = await prisma.bus.findMany({
            where: busQuery,
            include: {
                trips: {
                    where: {
                        departureTime: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
                rentals: {
                    where: {
                        status: {
                            in: ['PENDING', 'APPROVED'],
                        },
                        OR: [
                            {
                                AND: [
                                    { startDate: { lte: end } },
                                    { endDate: { gte: start } },
                                ],
                            },
                        ],
                    },
                },
            },
        })

        // Filtrer les bus disponibles (sans trajets ni locations pendant la période)
        const availableBuses = buses.filter(
            (bus) => bus.trips.length === 0 && bus.rentals.length === 0
        )

        // Récupérer les conflits pour information
        const conflicts = buses
            .filter((bus) => bus.trips.length > 0 || bus.rentals.length > 0)
            .map((bus) => ({
                busId: bus.id,
                busName: bus.name,
                trips: bus.trips.length,
                rentals: bus.rentals.length,
            }))

        return NextResponse.json({
            available: availableBuses.length > 0,
            availableBuses: availableBuses.map((bus) => ({
                id: bus.id,
                name: bus.name,
                plateNumber: bus.plateNumber,
                capacity: bus.capacity,
                seatType: bus.seatType,
                amenities: bus.amenities,
            })),
            conflicts: conflicts.length > 0 ? conflicts : undefined,
        })
    } catch (error) {
        console.error('Availability check error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
