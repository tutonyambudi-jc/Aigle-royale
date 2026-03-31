import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const active = (searchParams.get('active') || '').trim().toLowerCase()
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 200)))

    const where: any = {}
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        bus: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    const filtered =
      q.length === 0
        ? drivers
        : drivers.filter((d) => {
            const hay = `${d.firstName} ${d.lastName} ${d.phone || ''} ${d.licenseNumber || ''} ${d.bus?.name || ''} ${d.bus?.plateNumber || ''}`.toLowerCase()
            return hay.includes(q)
          })

    const buses = await prisma.bus.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, plateNumber: true },
    })

    return NextResponse.json({ drivers: filtered, buses })
  } catch (error) {
    console.error('Admin drivers list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const licenseNumber = typeof body?.licenseNumber === 'string' ? body.licenseNumber.trim() : ''
    const busId = typeof body?.busId === 'string' ? body.busId.trim() : ''

    if (!firstName || !lastName) return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 })

    const created = await prisma.driver.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        licenseNumber: licenseNumber || null,
        busId: busId || null,
        isActive: true,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, driverId: created.id }, { status: 201 })
  } catch (error: any) {
    console.error('Admin driver create error:', error)
    if (typeof error?.code === 'string' && error.code === 'P2002') {
      return NextResponse.json({ error: 'Numéro de permis déjà utilisé' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

