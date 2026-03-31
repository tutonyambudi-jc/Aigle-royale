import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function clampDays(n: number): number {
  if (!Number.isFinite(n)) return 7
  return Math.max(1, Math.min(30, Math.floor(n)))
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const from = typeof body?.from === 'string' ? body.from : ''
    const to = typeof body?.to === 'string' ? body.to : ''
    const companyId = typeof body?.companyId === 'string' ? body.companyId : ''
    const busId = typeof body?.busId === 'string' ? body.busId : ''
    const status = typeof body?.status === 'string' ? body.status : 'ALL'
    const expiresInDays = clampDays(Number(body?.expiresInDays ?? 7))

    if (!from) return NextResponse.json({ error: 'Paramètre "from" manquant' }, { status: 400 })

    const qs = new URLSearchParams()
    qs.set('from', from)
    if (to) qs.set('to', to)
    if (companyId) qs.set('companyId', companyId)
    if (busId) qs.set('busId', busId)
    if (status) qs.set('status', status)

    const token = crypto.randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    await prisma.manifestShare.create({
      data: {
        token,
        type: 'PASSENGERS',
        query: qs.toString(),
        expiresAt,
        createdById: session.user.id,
      },
    })

    const origin = new URL(request.url).origin
    const shareUrl = `${origin}/api/manifests/passengers/${token}`

    return NextResponse.json({ success: true, shareUrl, expiresAt }, { status: 201 })
  } catch (error) {
    console.error('Admin passenger manifest share create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

