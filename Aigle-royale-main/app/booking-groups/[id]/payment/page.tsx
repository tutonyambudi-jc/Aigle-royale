import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GroupPaymentForm } from '@/components/client/GroupPaymentForm'
import type { DisplayCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'

export default async function BookingGroupPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/booking-groups/${id}/payment`)}`)
  }

  const bookingGroup = await prisma.bookingGroup.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          trip: {
            include: {
              route: true,
              bus: true,
            },
          },
          seat: true,
          user: true,
        },
      },
      payment: true,
    },
  })

  if (!bookingGroup) {
    notFound()
  }

  // Vérifier que l'utilisateur a le droit de voir ce paiement
  if (bookingGroup.userId !== session.user.id && session.user.role !== 'ADMINISTRATOR') {
    notFound()
  }

  // Si déjà payé, rediriger vers la confirmation
  if (bookingGroup.paymentStatus === 'PAID') {
    redirect(`/booking-groups/${id}/confirmation`)
  }

  const cookieStore = await cookies()
  const currency = (cookieStore.get('preferred_currency')?.value as DisplayCurrency) || 'FC'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Paiement de votre réservation</h1>
          
          <GroupPaymentForm 
            bookingGroup={bookingGroup} 
            displayCurrency={currency}
          />
        </div>
      </div>
    </div>
  )
}
