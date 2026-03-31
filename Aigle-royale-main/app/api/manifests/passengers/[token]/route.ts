import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildPassengerManifestCsv } from '@/lib/manifests/passengers'

function parseYmdToLocalDate(ymd: string | null): Date | null {
  if (!ymd) return null
  const parts = ymd.split('-').map((x) => Number(x))
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const p = await params
  try {
    const token = p.token
    if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

    const share = await prisma.manifestShare.findUnique({
      where: { token },
      select: { id: true, type: true, query: true, expiresAt: true },
    })

    if (!share || share.type !== 'PASSENGERS') {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
    }

    if (share.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Lien expiré' }, { status: 410 })
    }

    const qs = new URLSearchParams(share.query)
    const from = parseYmdToLocalDate(qs.get('from')) || new Date(new Date().setHours(0, 0, 0, 0))
    const to = parseYmdToLocalDate(qs.get('to')) || from
    const companyId = qs.get('companyId') || undefined
    const busId = qs.get('busId') || undefined
    const tripId = qs.get('tripId') || undefined
    const status = (qs.get('status') || 'ALL') as any

    const { csv, filename } = await buildPassengerManifestCsv({
      from,
      to,
      companyId,
      busId,
      tripId,
      status,
    })

    await prisma.manifestShare.update({
      where: { token },
      data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Public passenger manifest share error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

