import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    })

    return NextResponse.json(cities.map((c) => c.name))
  } catch (error) {
    console.error('Cities list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

