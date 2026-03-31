import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const driverId = p.id
    const body = await request.json()

    const data: any = {}
    if (typeof body?.firstName === 'string') data.firstName = body.firstName.trim()
    if (typeof body?.lastName === 'string') data.lastName = body.lastName.trim()
    if (typeof body?.phone === 'string') data.phone = body.phone.trim() || null
    if (typeof body?.licenseNumber === 'string') data.licenseNumber = body.licenseNumber.trim() || null
    if (typeof body?.busId === 'string') data.busId = body.busId.trim() || null
    if (typeof body?.isActive === 'boolean') data.isActive = body.isActive

    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data,
      include: {
        bus: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    return NextResponse.json({ success: true, driver: updated })
  } catch (error: any) {
    console.error('Admin driver update error:', error)
    if (typeof error?.code === 'string' && error.code === 'P2002') {
      return NextResponse.json({ error: 'Numéro de permis déjà utilisé' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const driverId = p.id
    await prisma.driver.update({
      where: { id: driverId },
      data: { isActive: false, busId: null },
      select: { id: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin driver delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

