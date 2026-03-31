import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tripStopId: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    await prisma.tripStop.delete({
      where: { id: p.tripStopId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin trip stopover delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

