import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { RoundTripBookingForm } from '@/components/client/RoundTripBookingForm'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'

async function getTrip(id: string) {
    const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
            bus: {
                include: {
                    seats: {
                        include: {
                            bookings: {
                                where: {
                                    status: { in: ['CONFIRMED', 'PENDING'] },
                                },
                            },
                        },
                    },
                },
            },
            route: true,
            bookings: {
                where: {
                    status: { in: ['CONFIRMED', 'PENDING'] },
                },
                include: {
                    seat: true,
                },
            },
        },
    })

    return trip
}

export default async function BookRoundTripPage({
    searchParams,
}: {
    searchParams: Promise<{ outboundId?: string; returnId?: string }>
}) {
    const sp = await searchParams
    const { outboundId, returnId } = sp
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
    const session = await getServerSession(authOptions)

    if (!session) {
        const params = new URLSearchParams()
        if (outboundId) params.append('outboundId', outboundId)
        if (returnId) params.append('returnId', returnId)
        redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/trips/book-round-trip?${params.toString()}`)}`)
    }

    let user = null
    if (session?.user?.id) {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
            }
        })
    }

    if (!outboundId || !returnId) {
        redirect('/')
    }

    const [outboundTrip, returnTrip] = await Promise.all([
        getTrip(outboundId),
        getTrip(returnId),
    ])

    if (!outboundTrip || !returnTrip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Trajet introuvable</h1>
                    <p className="text-gray-600">Un ou plusieurs trajets demandés ne sont plus disponibles.</p>
                </div>
            </div>
        )
    }

    // Get available seats for both trips
    const outboundOccupied = outboundTrip.bookings.map((b) => b.seatId)
    const outboundSeats = outboundTrip.bus.seats.filter(
        (seat) => !outboundOccupied.includes(seat.id) && seat.isAvailable
    )

    const returnOccupied = returnTrip.bookings.map((b) => b.seatId)
    const returnSeats = returnTrip.bus.seats.filter(
        (seat) => !returnOccupied.includes(seat.id) && seat.isAvailable
    )

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="container mx-auto px-4 py-6">
                <DashboardBackButton />
            </div>
            <div className="py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Réservation Aller-Retour</h1>
                            <p className="text-gray-600">Complétez vos informations pour les deux trajets</p>
                        </div>
                        <RoundTripBookingForm
                            outboundTrip={outboundTrip}
                            returnTrip={returnTrip}
                            outboundSeats={outboundSeats}
                            returnSeats={returnSeats}
                            displayCurrency={currency}
                            user={user}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
