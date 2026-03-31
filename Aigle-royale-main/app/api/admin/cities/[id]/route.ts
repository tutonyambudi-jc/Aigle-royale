import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// DELETE /api/admin/cities/[id] -> Soft delete city
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.city.update({
            where: { id: p.id },
            data: { isActive: false },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de la ville' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/cities/[id] -> Update city
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const city = await prisma.city.update({
            where: { id: p.id },
            data: {
                name: body.name,
                // Add other fields if necessary
            },
        })
        return NextResponse.json(city)
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de la ville' },
            { status: 500 }
        )
    }
}
