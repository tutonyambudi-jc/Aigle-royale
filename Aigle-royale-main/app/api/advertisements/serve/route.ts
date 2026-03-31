import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || '').trim()

    if (!type) {
      return NextResponse.json({ error: 'Type requis' }, { status: 400 })
    }

    const now = new Date()
    const candidates = await prisma.advertisement.findMany({
      where: {
        type,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    if (candidates.length === 0) {
      return NextResponse.json(null)
    }

    const ad = candidates[Math.floor(Math.random() * candidates.length)]

    // Impression tracking (best-effort)
    prisma.advertisement
      .update({
        where: { id: ad.id },
        data: { impressions: { increment: 1 } },
      })
      .catch(() => {})

    return NextResponse.json({
      id: ad.id,
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      type: ad.type,
    })
  } catch (error) {
    console.error('Advertisement serve error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

