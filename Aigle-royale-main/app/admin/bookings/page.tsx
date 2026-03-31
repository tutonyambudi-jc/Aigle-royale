import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookingActionButtons } from '@/components/admin/BookingActionButtons'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
    const sp = await searchParams
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

    const page = Number(sp.page) || 1
    const limit = Number(sp.limit) || 20
    const skip = (page - 1) * limit

    const [bookings, totalBookings] = await Promise.all([
        prisma.booking.findMany({
            where: {
                trip: {
                    departureTime: {
                        gte: new Date() // Only show bookings for future trips
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
                trip: {
                    include: {
                        route: true,
                    },
                },
                travelVoucher: {
                    select: {
                        code: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.booking.count({
            where: {
                trip: {
                    departureTime: {
                        gte: new Date() // Count only future trips
                    }
                }
            }
        })
    ])

    console.log('Bookings:', bookings);
    console.log('Total Bookings:', totalBookings);

    const promotionPercentage = 0; // Temporairement fixe car composant serveur

    const applyPromotion = (price: number, percentage: number) => {
        return price - (price * percentage) / 100;
    };

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Gérer les réservations</h1>
                    <p className="text-gray-600 font-medium tracking-tight">Validation et suivi des ventes de billets.</p>
                </div>
                <Link
                    href="/admin"
                    className="px-5 py-2.5 rounded-2xl border-2 border-gray-100 bg-white hover:bg-gray-50 font-black text-gray-800 transition-all active:scale-95 shadow-sm"
                >
                    ← Retour admin
                </Link>
            </div>

            <div className="mb-4 text-sm text-gray-500 italic">
                {/* La gestion des promotions interactives doit être déplacée dans un composant client dédié */}
                Note: Les promotions sont actuellement désactivées sur cette vue serveur.
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-10 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full translate-x-16 -translate-y-16"></div>

                <div className="relative flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dernières réservations</h2>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Listing complet des transactions</p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl text-primary-600 font-black text-sm">
                        <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
                        {totalBookings} Total
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Aucune réservation</h3>
                        <p className="text-gray-500 font-medium">Les nouvelles réservations apparaîtront ici.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                                        <th className="pb-4 pr-6">Référence</th>
                                        <th className="pb-4 pr-6">Client / Passager</th>
                                        <th className="pb-4 pr-6">Trajet</th>
                                        <th className="pb-4 pr-6">Départ</th>
                                        <th className="pb-4 pr-6">Prix Vente</th>
                                        <th className="pb-4 pr-6">Bon de voyage</th>
                                        <th className="pb-4 pr-6 text-center">Statut</th>
                                        <th className="pb-4 pr-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="group hover:bg-primary-50/30 transition-colors">
                                            <td className="py-5 pr-6 font-black text-xs text-gray-500 font-mono tracking-tighter">
                                                #{booking.ticketNumber || booking.id.slice(0, 8)}
                                            </td>
                                            <td className="py-5 pr-6">
                                                <div className="font-black text-gray-900 group-hover:text-primary-600 transition-colors">{booking.passengerName}</div>
                                                <div className="text-xs font-bold text-gray-400 mt-0.5">{booking.passengerPhone}</div>
                                            </td>
                                            <td className="py-5 pr-6">
                                                <div className="font-black text-gray-700 italic text-sm">
                                                    {booking.trip.route.origin} <span className="mx-1 opacity-30 not-italic tracking-normal">→</span> {booking.trip.route.destination}
                                                </div>
                                            </td>
                                            <td className="py-5 pr-6">
                                                <div className="text-sm font-black text-gray-900 uppercase tracking-tighter">
                                                    {new Date(booking.trip.departureTime).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    })}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400">
                                                    {new Date(booking.trip.departureTime).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-5 pr-6">
                                                {(() => {
                                                    const basePrice = Number(booking.basePrice || booking.trip.price)
                                                    const discountAmount = Number(booking.discountAmount || 0)
                                                    const extrasTotal = Number(booking.extrasTotal || 0)
                                                    const subtotal = Math.max(0, basePrice - discountAmount + extrasTotal)
                                                    const total = applyPromotion(booking.totalPrice || booking.trip.price, promotionPercentage)
                                                    const serviceFee = Math.max(0, total - subtotal)
                                                    return (
                                                        <div>
                                                            <div className="text-lg font-black text-gray-900">{formatCurrency(total, currency)}</div>
                                                            <div className="text-[10px] text-gray-500 mt-1">
                                                                Sous-total: <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                Frais: <span className="font-semibold">{formatCurrency(serviceFee, currency)}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            <td className="py-5 pr-6">
                                                {booking.travelVoucher ? (
                                                    <div>
                                                        <div className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 inline-block px-2 py-1 rounded-md font-mono">
                                                            {booking.travelVoucher.code}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
                                                            {booking.travelVoucher.status}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="py-5 pr-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.status === 'CONFIRMED' ? 'bg-green-500 text-white shadow-green-100' :
                                                        booking.status === 'PENDING' ? 'bg-amber-500 text-white shadow-amber-100' :
                                                            booking.status === 'CANCELLED' ? 'bg-rose-500 text-white shadow-rose-100' :
                                                                'bg-gray-400 text-white'
                                                        }`}>
                                                        {booking.status === 'CONFIRMED' ? 'Validé' :
                                                            booking.status === 'PENDING' ? 'En attente' :
                                                                booking.status === 'CANCELLED' ? 'Annulé' : booking.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 pr-6 text-right">
                                                <BookingActionButtons bookingId={booking.id} status={booking.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <PaginationControls
                            totalItems={totalBookings}
                            currentLimit={limit}
                            currentPage={page}
                        />
                    </>
                )}
            </div>
        </>
    )
}
