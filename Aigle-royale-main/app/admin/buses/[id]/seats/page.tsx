import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SeatVisibilityManager from '@/components/admin/SeatVisibilityManager'

export default async function BusSeatsPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    
    const bus = await prisma.bus.findUnique({
        where: { id: p.id },
        include: { 
            company: true,
            seats: {
                orderBy: {
                    seatNumber: 'asc'
                }
            }
        },
    })

    if (!bus) {
        notFound()
    }

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Sièges</h1>
                    <p className="text-gray-600">{bus.name} ({bus.plateNumber})</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {bus.seats.length} sièges configurés • Capacité: {bus.capacity}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/admin/buses/${bus.id}`}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                    >
                        ← Modifier le bus
                    </Link>
                    <Link
                        href="/admin/buses"
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                    >
                        Tous les bus
                    </Link>
                </div>
            </div>

            <SeatVisibilityManager busId={bus.id} seats={bus.seats} />
        </>
    )
}
