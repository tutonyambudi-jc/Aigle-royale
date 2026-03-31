import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const reviews = await prisma.companyReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        company: { select: { name: true } },
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Admin company reviews list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const reviewId = typeof body?.reviewId === 'string' ? body.reviewId : ''
    const isVisible = body?.isVisible === true

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId requis' }, { status: 400 })
    }

    const review = await prisma.companyReview.update({
      where: { id: reviewId },
      data: { isVisible },
      select: { id: true, isVisible: true },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Admin company review update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
