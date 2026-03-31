'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAgentCommissionRate(
    agentId: string,
    rate: number
) {
    try {
        if (rate < 0 || rate > 100) {
            return { success: false, error: 'Le taux doit être entre 0 et 100%' }
        }

        await prisma.user.update({
            where: { id: agentId },
            data: {
                commissionRate: rate,
            },
        })

        revalidatePath('/admin/commissions')
        revalidatePath('/admin/commissions/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to update commission rate:', error)
        return { success: false, error: 'Erreur lors de la mise à jour' }
    }
}

export async function updateGlobalCommissionRate(
    rate: number
) {
    try {
        if (rate < 0 || rate > 100) {
            return { success: false, error: 'Le taux doit être entre 0 et 100%' }
        }

        // Mettre à jour tous les agents
        await prisma.user.updateMany({
            where: { role: 'AGENT' },
            data: {
                commissionRate: rate,
            },
        })

        revalidatePath('/admin/commissions')
        revalidatePath('/admin/commissions/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to update global commission rate:', error)
        return { success: false, error: 'Erreur lors de la mise à jour' }
    }
}

export async function markCommissionAsPaid(commissionId: string) {
    try {
        await prisma.commission.update({
            where: { id: commissionId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        })

        revalidatePath('/admin/commissions')
        return { success: true }
    } catch (error) {
        console.error('Failed to mark commission as paid:', error)
        return { success: false, error: 'Erreur lors de la mise à jour' }
    }
}

export async function markCommissionAsPending(commissionId: string) {
    try {
        await prisma.commission.update({
            where: { id: commissionId },
            data: {
                status: 'PENDING',
                paidAt: null,
            },
        })

        revalidatePath('/admin/commissions')
        return { success: true }
    } catch (error) {
        console.error('Failed to mark commission as pending:', error)
        return { success: false, error: 'Erreur lors de la mise à jour' }
    }
}
