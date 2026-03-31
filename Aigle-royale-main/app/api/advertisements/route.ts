import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    // Pour les utilisateurs non-admin, ne montrer que les publicités actives
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR')) {
      where.status = 'ACTIVE'
      const now = new Date()
      where.startDate = { lte: now }
      where.endDate = { gte: now }
    }

    const advertisements = await prisma.advertisement.findMany({
      where,
      include: {
        advertiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(advertisements)
  } catch (error) {
    console.error('Advertisements fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Seuls les admins peuvent créer des publicités
    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      advertiserId,
      title,
      description,
      imageUrl,
      linkUrl,
      type,
      startDate,
      endDate,
    } = body

    // Validation
    if (!title || !imageUrl || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const advertisement = await prisma.advertisement.create({
      data: {
        advertiserId: advertiserId || session.user.id,
        title,
        description: description || null,
        imageUrl,
        linkUrl: linkUrl || null,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(advertisement, { status: 201 })
  } catch (error) {
    console.error('Advertisement creation error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la publicité' },
      { status: 500 }
    )
  }
}
