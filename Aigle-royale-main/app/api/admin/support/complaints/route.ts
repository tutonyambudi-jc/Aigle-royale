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
    const status = searchParams.get('status') || ''
    const take = Math.min(200, Math.max(10, Number(searchParams.get('limit')) || 100))

    const complaints = await prisma.supportComplaint.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ complaints })
  } catch (error) {
    console.error('Admin support complaints GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const status =
      typeof body?.status === 'string' && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(body.status)
        ? body.status
        : undefined
    const priority =
      typeof body?.priority === 'string' && ['LOW', 'NORMAL', 'HIGH'].includes(body.priority)
        ? body.priority
        : undefined
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes : undefined

    const data: {
      status?: string
      priority?: string
      adminNotes?: string | null
      resolvedAt?: Date | null
    } = {}

    if (status) {
      data.status = status
      if (status === 'RESOLVED' || status === 'CLOSED') {
        data.resolvedAt = new Date()
      } else {
        data.resolvedAt = null
      }
    }
    if (priority) data.priority = priority
    if (adminNotes !== undefined) data.adminNotes = adminNotes || null

    const complaint = await prisma.supportComplaint.update({
      where: { id },
      data,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Admin support complaints PATCH:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
