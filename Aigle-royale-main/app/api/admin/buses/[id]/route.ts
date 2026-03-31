import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role?: string) {
    return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    try {
        const session = await getServerSession(authOptions)
        if (!session || !isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        const json = await request.json()
        const { name, plateNumber, brand, capacity, amenities, seatType, imageUrl, companyName } = json

        // Check company
        let companyId = undefined
        if (companyName) {
            const company = await prisma.busCompany.upsert({
                where: { name: companyName },
                update: {},
                create: { name: companyName },
            })
            companyId = company.id
        }

        const updatedBus = await prisma.bus.update({
            where: { id: p.id },
            data: {
                name,
                plateNumber,
                brand,
                capacity: Number(capacity),
                amenities,
                seatType,
                imageUrl,
                ...(companyId && { companyId }),
            },
        })

        return NextResponse.json(updatedBus)
    } catch (error: any) {
        console.error('Error updating bus:', error)
        return NextResponse.json({ error: error.message || 'Erreur lors de la modification' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    try {
        const session = await getServerSession(authOptions)
        if (!session || !isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        await prisma.bus.update({
            where: { id: p.id },
            data: { isActive: false }, // Soft delete usually better
        })

        // Or hard delete if preferred, but existing relations might break.
        // Let's stick to update isActive=false if schema supports it, 
        // but looking at schema line 79: `isActive Boolean @default(true)` - yes it does.

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting bus:', error)
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }
}
