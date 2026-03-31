'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema de validation
const offerSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    code: z.string().optional().or(z.literal('')),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.coerce.number().min(0, "La valeur doit être positive"),
    startDate: z.string(),
    endDate: z.string(),
    isActive: z.boolean().optional(),
    usageLimit: z.coerce.number().optional().nullable(),
    minAmount: z.coerce.number().optional().nullable(),
})

export async function createOffer(formData: FormData) {
    try {
        const rawData = {
            title: formData.get('title'),
            description: formData.get('description'),
            code: formData.get('code'),
            discountType: formData.get('discountType'),
            discountValue: formData.get('discountValue'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            isActive: formData.get('isActive') === 'on',
            usageLimit: formData.get('usageLimit') || null,
            minAmount: formData.get('minAmount') || null,
        }

        const data = offerSchema.parse(rawData)

        await prisma.offer.create({
            data: {
                title: data.title,
                description: data.description || null,
                code: data.code || null,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: data.isActive || true,
                usageLimit: data.usageLimit || null,
                minAmount: data.minAmount || null,
            },
        })

        revalidatePath('/admin/offers')
        return { success: true }
    } catch (error) {
        console.error('Failed to create offer:', error)
        return { success: false, error: 'Erreur lors de la création de l\'offre' }
    }
}

export async function updateOffer(id: string, formData: FormData) {
    try {
        const rawData = {
            title: formData.get('title'),
            description: formData.get('description'),
            code: formData.get('code'),
            discountType: formData.get('discountType'),
            discountValue: formData.get('discountValue'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            isActive: formData.get('isActive') === 'on',
            usageLimit: formData.get('usageLimit') || null,
            minAmount: formData.get('minAmount') || null,
        }

        const data = offerSchema.parse(rawData)

        await prisma.offer.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description || null,
                code: data.code || null,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: data.isActive || false,
                usageLimit: data.usageLimit || null,
                minAmount: data.minAmount || null,
            },
        })

        revalidatePath('/admin/offers')
        return { success: true }
    } catch (error) {
        console.error('Failed to update offer:', error)
        return { success: false, error: 'Erreur lors de la mise à jour de l\'offre' }
    }
}

export async function deleteOffer(id: string) {
    try {
        await prisma.offer.delete({
            where: { id },
        })
        revalidatePath('/admin/offers')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete offer:', error)
        return { success: false, error: 'Erreur lors de la suppression' }
    }
}

export async function toggleOfferStatus(id: string, currentStatus: boolean) {
    try {
        await prisma.offer.update({
            where: { id },
            data: { isActive: !currentStatus },
        })
        revalidatePath('/admin/offers')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erreur lors du changement de statut' }
    }
}
