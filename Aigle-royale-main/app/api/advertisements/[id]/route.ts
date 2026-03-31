import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: p.id },
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
    })

    if (!advertisement) {
      return NextResponse.json(
        { error: 'Publicité introuvable' },
        { status: 404 }
      )
    }

    // Incrémenter les impressions
    await prisma.advertisement.update({
      where: { id: p.id },
      data: {
        impressions: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(advertisement)
  } catch (error) {
    console.error('Advertisement fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      type,
      status,
      startDate,
      endDate,
    } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)

    const advertisement = await prisma.advertisement.update({
      where: { id: p.id },
      data: updateData,
    })

    return NextResponse.json(advertisement)
  } catch (error) {
    console.error('Advertisement update error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    await prisma.advertisement.delete({
      where: { id: p.id },
    })

    return NextResponse.json({ message: 'Publicité supprimée' })
  } catch (error) {
    console.error('Advertisement delete error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
