import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/layout/Navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default async function MyRentalsPage() {
    const session = await getServerSession(authOptions)

    if (!session) redirect('/auth/login')

    const rentals = await prisma.busRental.findMany({
        where: { userId: session.user.id },
        include: {
            bus: true,
            driver: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
            APPROVED: 'bg-green-100 text-green-700 border-green-200',
            REJECTED: 'bg-red-100 text-red-700 border-red-200',
            COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
            CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles] || styles.PENDING}`}>
                {status}
            </span>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Mes Locations de Bus</h1>
                        <p className="text-gray-600">Suivez l'état de vos demandes de location et consultez les détails.</p>
                    </div>

                    <div className="space-y-6">
                        {rentals.map((rental) => (
                            <div key={rental.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(rental.status)}
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Ref: {rental.id.slice(0, 8)}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-black text-gray-900">
                                                {rental.departureLocation} → {rental.destination}
                                            </h4>
                                            <p className="text-gray-500 font-medium">
                                                {format(new Date(rental.startDate), 'PPPP', { locale: fr })}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-2">
                                            <div className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2">
                                                <span>👥</span> {rental.passengerCount} personnes
                                            </div>
                                            <div className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2">
                                                <span>🚌</span> {rental.preferredBusType}
                                            </div>
                                            <div className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-primary-600 flex items-center gap-2">
                                                <span>⏰</span> {rental.startTime} - {rental.endTime}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right space-y-4 md:min-w-[180px]">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix Total</p>
                                            <p className="text-2xl font-black text-primary-600">
                                                {rental.finalPrice || rental.basePrice || 0} <span className="text-sm">FC</span>
                                            </p>
                                        </div>

                                        {rental.status === 'APPROVED' && (
                                            <button className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-black text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:scale-[1.02] transition-all">
                                                Payer maintenant
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {rental.bus && (
                                    <div className="mt-8 pt-8 border-t border-dashed border-gray-100 grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Véhicule Attribué</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🚌</div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{rental.bus.name}</p>
                                                    <p className="text-xs text-gray-500">{rental.bus.plateNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {rental.driver && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Votre Chauffeur</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">👨‍✈️</div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{rental.driver.firstName}</p>
                                                        <p className="text-xs text-gray-500">{rental.driver.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {rentals.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="text-5xl mb-6 opacity-20">🚌</div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Aucune location</h3>
                                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Vous n'avez pas encore fait de demande de location de bus.</p>
                                <Link href="/" className="px-8 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all">
                                    Faire une demande
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
