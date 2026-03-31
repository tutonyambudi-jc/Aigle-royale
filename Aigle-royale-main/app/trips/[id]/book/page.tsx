import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { BookingForm } from '@/components/client/BookingForm'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'

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
      route: {
        include: {
          stops: {
            orderBy: { order: 'asc' },
            include: {
              stop: {
                include: {
                  city: true
                }
              }
            }
          }
        }
      },
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

export default async function BookTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    adults?: string
    children?: string
    babies?: string
    seniors?: string
  }>
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getServerSession(authOptions)

  // Build the full callback URL with passenger params
  const passengerParams = new URLSearchParams({
    adults: sp.adults || '1',
    children: sp.children || '0',
    babies: sp.babies || '0',
    seniors: sp.seniors || '0'
  }).toString()

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/trips/${id}/book?${passengerParams}`)}`)
  }

  // Get passenger counts from search params
  const passengerCounts = {
    adults: parseInt(sp.adults || '1'),
    children: parseInt(sp.children || '0'),
    babies: parseInt(sp.babies || '0'),
    seniors: parseInt(sp.seniors || '0')
  }
  
  console.log('BookTripPage searchParams:', sp)
  console.log('BookTripPage passengerCounts:', passengerCounts)

  // On récupère la devise
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

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

  const trip = await getTrip(id)

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trajet introuvable</h1>
          <p className="text-gray-600">Le trajet demandé n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  // Déterminer les sièges occupés
  const occupiedSeatIds = trip.bookings.map((booking) => booking.seatId)
  const availableSeats = trip.bus.seats.filter(
    (seat) => !occupiedSeatIds.includes(seat.id) && seat.isAvailable
  )

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-6">
        <DashboardBackButton />
      </div>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Réserver votre billet</h1>
            <BookingForm
              trip={trip}
              availableSeats={availableSeats}
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
