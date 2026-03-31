import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    await prisma.cityStop.update({
      where: { id: p.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting city stop:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const { name, address } = body

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const cityStop = await prisma.cityStop.update({
      where: { id: p.id },
      data: {
        name,
        address: address || null
      },
      include: {
        city: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(cityStop)
  } catch (error) {
    console.error('Error updating city stop:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
