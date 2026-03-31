import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cette route peut être appelée par un CRON job externe (ex: toutes les 5 minutes)
// Ou manuellement par un admin
export async function GET(request: Request) {
    try {
        const now = new Date()

        // 1. Trouver tous les paiements expirés
        // status = PENDING et paymentDeadline < maintenant
        const expiredPayments = await prisma.payment.findMany({
            where: {
                status: 'PENDING',
                paymentDeadline: {
                    lt: now,
                    not: null, // S'assurer qu'il y a une deadline
                },
            },
            include: {
                booking: true,
            },
        })

        console.log(`[Cleanup] Found ${expiredPayments.length} expired payments to process`)

        if (expiredPayments.length === 0) {
            return NextResponse.json({ success: true, processed: 0 })
        }

        let processedCount = 0
        const errors = []

        // 2. Traiter chaque paiement expiré
        for (const payment of expiredPayments) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Marquer le paiement comme FAILED/EXPIRED
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: 'FAILED' },
                    })

                    // Si la réservation n'est pas déjà annulée ou complétée
                    if (payment.booking && payment.booking.status === 'PENDING') {
                        await tx.booking.update({
                            where: { id: payment.booking.id },
                            data: { status: 'CANCELLED' },
                        })
                    }
                })
                processedCount++
            } catch (err) {
                console.error(`[Cleanup] Error processing payment ${payment.id}:`, err)
                errors.push({ id: payment.id, error: String(err) })
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            totalFound: expiredPayments.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        console.error('[Cleanup] Global error:', error)
        return NextResponse.json(
            { error: 'Une erreur est survenue lors du nettoyage' },
            { status: 500 }
        )
    }
}
