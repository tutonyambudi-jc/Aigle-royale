import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const companyId = typeof body?.companyId === 'string' ? body.companyId : ''
    const rating = Number(body?.rating)
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''

    if (!companyId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const company = await prisma.busCompany.findUnique({ where: { id: companyId }, select: { id: true } })
    if (!company) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 404 })

    const hasEligibleBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        trip: { bus: { companyId } },
      },
      select: { id: true },
    })

    if (!hasEligibleBooking) {
      return NextResponse.json(
        { error: 'Vous devez avoir un billet confirmé ou terminé avec cette compagnie pour noter.' },
        { status: 403 }
      )
    }

    const review = await prisma.companyReview.upsert({
      where: { userId_companyId: { userId: session.user.id, companyId } },
      create: {
        userId: session.user.id,
        companyId,
        rating: Math.round(rating),
        comment: comment || null,
        isVerified: true,
        isVisible: true,
      },
      update: {
        rating: Math.round(rating),
        comment: comment || null,
        isVerified: true,
        isVisible: true,
      },
      select: { id: true, rating: true, comment: true, updatedAt: true },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Company review error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la note' }, { status: 500 })
  }
}
