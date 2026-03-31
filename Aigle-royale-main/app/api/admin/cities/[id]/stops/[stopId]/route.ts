import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; stopId: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.cityStop.update({
            where: { id: p.stopId },
            data: { isActive: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting city stop:', error)
        return NextResponse.json(
            { error: 'Failed to delete stop' },
            { status: 500 }
        )
    }
}
