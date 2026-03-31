import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    const updated = await prisma.passengerPricing.update({
      where: { id: p.id },
      data: {
        discountPercent: parseFloat(body.discountPercent),
        minAge: body.minAge ? parseInt(body.minAge) : null,
        maxAge: body.maxAge ? parseInt(body.maxAge) : null,
        description: body.description || null,
        isActive: Boolean(body.isActive),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating passenger pricing:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
