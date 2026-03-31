import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeSearchText } from '@/lib/search'
import { format } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin')
        const destination = searchParams.get('destination')
        const startDate = searchParams.get('startDate')
        const daysStr = searchParams.get('days') || '7'
        const days = parseInt(daysStr, 10)

        if (!origin || !destination || !startDate) {
            return NextResponse.json(
                { error: 'Paramètres manquants' },
                { status: 400 }
            )
        }

        const o = normalizeSearchText(origin)
        const d = normalizeSearchText(destination)

        const availability = await Promise.all(
            Array.from({ length: days }, async (_, i) => {
                const currentDate = new Date(startDate)
                currentDate.setDate(currentDate.getDate() + i)
                const dateStr = format(currentDate, 'yyyy-MM-dd')

                const startOfDay = new Date(currentDate)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(currentDate)
                endOfDay.setHours(23, 59, 59, 999)

                const trips = await prisma.trip.findMany({
                    where: {
                        isActive: true,
                        departureTime: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                        route: {
                            isActive: true,
                        },
                    },
                    include: {
                        route: true
                    }
                })

                const count = trips.filter((t) => {
                    const ro = normalizeSearchText(t.route?.origin || '')
                    const rd = normalizeSearchText(t.route?.destination || '')
                    return ro.includes(o) && rd.includes(d)
                }).length

                return { date: dateStr, count }
            })
        )

        return NextResponse.json(availability)
    } catch (error) {
        console.error('Trip availability error:', error)
        return NextResponse.json(
            { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
            { status: 500 }
        )
    }
}
