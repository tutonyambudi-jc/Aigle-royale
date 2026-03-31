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
                        where: {
                            isHidden: false, // Exclure les sièges cachés
                        },
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
    searchParams: Promise<{ 
        outboundId?: string
        returnId?: string
        adults?: string
        children?: string
        babies?: string
        seniors?: string
    }>
}) {
    const sp = await searchParams
    const { outboundId, returnId, adults, children, babies, seniors } = sp
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
    const session = await getServerSession(authOptions)

    // Get passenger counts from search params
    const passengerCounts = {
        adults: parseInt(adults || '1'),
        children: parseInt(children || '0'),
        babies: parseInt(babies || '0'),
        seniors: parseInt(seniors || '0')
    }

    if (!session) {
        const params = new URLSearchParams()
        if (outboundId) params.append('outboundId', outboundId)
        if (returnId) params.append('returnId', returnId)
        if (adults) params.append('adults', adults)
        if (children) params.append('children', children)
        if (babies) params.append('babies', babies)
        if (seniors) params.append('seniors', seniors)
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
                            passengerCounts={passengerCounts}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
