import { prisma } from '@/lib/prisma'
import { BusRegistrationForm } from '@/components/admin/BusRegistrationForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditBusPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    const bus = await prisma.bus.findUnique({
        where: { id: p.id },
        include: { company: true },
    })

    if (!bus) {
        notFound()
    }

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifier le Bus</h1>
                    <p className="text-gray-600">{bus.name} ({bus.plateNumber})</p>
                </div>
                <Link
                    href="/admin/buses"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour aux bus
                </Link>
            </div>

            <div className="max-w-4xl mx-auto">
                <BusRegistrationForm
                    initialData={{
                        id: bus.id,
                        companyName: bus.company?.name || '',
                        name: bus.name,
                        plateNumber: bus.plateNumber,
                        brand: bus.brand || '',
                        capacity: bus.capacity,
                        amenities: bus.amenities || '',
                        seatType: bus.seatType as 'STANDARD' | 'VIP',
                    }}
                />
            </div>
        </>
    )
}
