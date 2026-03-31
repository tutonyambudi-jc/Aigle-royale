import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const status = typeof body?.status === 'string' ? body.status.trim().toUpperCase() : ''
    if (!status || !['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const updated = await prisma.advertisementInquiry.update({
      where: { id: p.id },
      data: { status },
    })

    return NextResponse.json({ success: true, inquiry: updated })
  } catch (error) {
    console.error('Advertisement inquiry update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await prisma.advertisementInquiry.delete({ where: { id: p.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Advertisement inquiry delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

