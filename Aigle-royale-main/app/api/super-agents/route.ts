import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        // Récupérer tous les super agents actifs
        const superAgents = await prisma.user.findMany({
            where: {
                role: 'SUPER_AGENT',
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                city: true,
                gender: true,
                birthDate: true,
                passportOrIdNumber: true,
                passportPhotoUrl: true,
                fingerprintUrl: true,
                createdAt: true,
            },
            orderBy: {
                firstName: 'asc',
            },
        })

        return NextResponse.json(superAgents)
    } catch (error) {
        console.error('Error fetching super agents:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des agences' },
            { status: 500 }
        )
    }
}
