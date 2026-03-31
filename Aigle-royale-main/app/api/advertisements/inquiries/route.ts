import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const inquiries = await prisma.advertisementInquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Advertisement inquiries list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : ''
    const contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const desiredType = typeof body?.desiredType === 'string' ? body.desiredType.trim() : ''
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : ''
    const linkUrl = typeof body?.linkUrl === 'string' ? body.linkUrl.trim() : ''

    const desiredStartDate = body?.desiredStartDate ? new Date(body.desiredStartDate) : null
    const desiredEndDate = body?.desiredEndDate ? new Date(body.desiredEndDate) : null

    if (!companyName || !contactName || !email || !desiredType) {
      return NextResponse.json({ error: 'Veuillez remplir les champs requis' }, { status: 400 })
    }

    const created = await prisma.advertisementInquiry.create({
      data: {
        companyName,
        contactName,
        email,
        phone: phone || null,
        message: message || null,
        desiredType,
        desiredStartDate: desiredStartDate && Number.isFinite(desiredStartDate.getTime()) ? desiredStartDate : null,
        desiredEndDate: desiredEndDate && Number.isFinite(desiredEndDate.getTime()) ? desiredEndDate : null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, inquiry: created }, { status: 201 })
  } catch (error) {
    console.error('Advertisement inquiry create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

