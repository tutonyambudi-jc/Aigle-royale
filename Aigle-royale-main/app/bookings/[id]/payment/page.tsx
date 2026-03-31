import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { PaymentForm } from '@/components/client/PaymentForm'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'
import { cookies } from 'next/headers'
import { type DisplayCurrency } from '@/lib/utils'

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

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!session) {
    redirect('/auth/login')
  }

  const booking = await getBooking(p.id)

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
        </div>
      </div>
    )
  }

  if (booking.userId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
        </div>
      </div>
    )
  }

  if (booking.status === 'CONFIRMED' && booking.payment) {
    redirect(`/bookings/${booking.id}/confirmation`)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-6">
        <DashboardBackButton />
      </div>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Paiement</h1>
            <PaymentForm booking={booking as any} currency={currency} />
          </div>
        </div>
      </div>
    </div>
  )
}
