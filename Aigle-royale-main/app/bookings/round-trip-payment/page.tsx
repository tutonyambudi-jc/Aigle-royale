import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { RoundTripPaymentForm } from '@/components/client/RoundTripPaymentForm'
import { cookies } from 'next/headers'
import { type DisplayCurrency } from '@/lib/utils'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'

async function getBooking(id: string) {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            trip: {
                include: {
                    route: true,
                    bus: true,
                },
            },
            seat: true,
            payment: true,
        },
    })
    return booking
}

export default async function RoundTripPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ outboundId?: string; returnId?: string }>
}) {
    const sp = await searchParams
    const { outboundId, returnId } = sp
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

    if (!outboundId || !returnId) {
        redirect('/')
    }

    const [outboundBooking, returnBooking] = await Promise.all([
        getBooking(outboundId),
        getBooking(returnId),
    ])

    if (!outboundBooking || !returnBooking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
                    <p className="text-gray-600">Une ou plusieurs réservations n'existent pas.</p>
                </div>
            </div>
        )
    }

    // Check if already paid
    if (outboundBooking.status === 'CONFIRMED' && returnBooking.status === 'CONFIRMED') {
        redirect(`/bookings/${outboundBooking.id}/confirmation`)
    }

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="container mx-auto px-4 py-6">
                <DashboardBackButton />
            </div>
            <div className="py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">Paiement Aller-Retour</h1>
                        <RoundTripPaymentForm
                            outboundBooking={outboundBooking as any}
                            returnBooking={returnBooking as any}
                            currency={currency}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
