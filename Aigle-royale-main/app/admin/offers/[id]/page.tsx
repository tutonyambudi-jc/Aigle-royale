import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditOfferForm } from '@/components/admin/EditOfferForm'
import Link from 'next/link'

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    const offer = await prisma.offer.findUnique({
        where: { id: p.id },
    })

    if (!offer) {
        notFound()
    }

    // Serialize only dates or simply JSON-parse-stringify to avoid "Plain Object" errors
    const serializedOffer = JSON.parse(JSON.stringify(offer))

    return (
        <>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifier l'offre</h1>
                    <p className="text-gray-600">Modification de {offer.title}</p>
                </div>
                <Link
                    href="/admin/offers"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
                >
                    ← Retour
                </Link>
            </div>
            <EditOfferForm offer={serializedOffer} />
        </>
    )
}
