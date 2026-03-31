import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const ad = await prisma.advertisement.findUnique({
      where: { id: p.id },
      select: { id: true, linkUrl: true },
    })

    if (!ad) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Incrémenter les clics (best-effort)
    prisma.advertisement
      .update({
        where: { id: ad.id },
        data: { clicks: { increment: 1 } },
      })
      .catch(() => { })

    const raw = (ad.linkUrl || '/').trim()
    const target = raw.startsWith('http://') || raw.startsWith('https://') ? raw : new URL(raw, request.url)
    return NextResponse.redirect(target)
  } catch (error) {
    console.error('Advertisement click redirect error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    // Incrémenter les clics
    await prisma.advertisement.update({
      where: { id: p.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Advertisement click error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
