import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLogisticsSession } from '../_utils'

export async function GET(request: Request) {
  try {
    const auth = await requireLogisticsSession()
    if (!auth.ok) return auth.response

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
    console.error('Logistics drivers list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

