import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { cookies } from 'next/headers'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'
import { type DisplayCurrency } from '@/lib/utils'
import { BookingExtrasForm } from '@/components/reservations/BookingExtrasForm'
import Link from 'next/link'

const WIFI_PASS_PRICE_FC = (() => {
  const raw = process.env.NEXT_PUBLIC_WIFI_PASS_PRICE_FC
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n >= 0 ? n : 1000
})()

export default async function BookingExtrasPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  if (session.user.role !== 'CLIENT') redirect('/dashboard')

  const booking = await prisma.booking.findUnique({
    where: { id: p.id },
    include: {
      trip: { include: { route: true } },
      payment: true,
      meal: true,
    },
  })

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
          <Link href="/reservations" className="text-primary-700 font-bold hover:underline">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  if (booking.userId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
          <Link href="/reservations" className="text-primary-700 font-bold hover:underline">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  if (booking.status !== 'PENDING' || booking.payment?.status === 'PAID') {
    redirect('/reservations')
  }

  const meals = await prisma.meal.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true, price: true },
    take: 200,
  })

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-8">
        <DashboardBackButton />
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Services à bord</h1>
          <p className="text-gray-600">
            Réservation: <span className="font-semibold">{booking.trip.route.origin} → {booking.trip.route.destination}</span>
          </p>
        </div>

        <BookingExtrasForm
          bookingId={booking.id}
          tripPrice={booking.trip.price}
          initialMealId={booking.mealId || null}
          initialWifiPass={booking.wifiPass || false}
          initialExtraBaggagePieces={booking.extraBaggagePieces || 0}
          initialExtraBaggageOverweightKg={booking.extraBaggageOverweightKg || 0}
          meals={meals}
          currency={currency}
          wifiPriceXof={WIFI_PASS_PRICE_FC}
        />

        <div className="mt-6 flex justify-end">
          <Link
            href={`/bookings/${booking.id}/payment`}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-extrabold hover:bg-primary-700"
          >
            Continuer vers paiement →
          </Link>
        </div>
      </div>
    </div>
  )
}

