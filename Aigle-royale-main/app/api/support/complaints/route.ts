import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSupportReference } from '@/lib/support-utils'

const CATEGORIES = ['RESERVATION', 'PAYMENT', 'BAGGAGE', 'SERVICE', 'OTHER'] as const

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }
    const list = await prisma.supportComplaint.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        reference: true,
        category: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ complaints: list })
  } catch (error) {
    console.error('Support complaints GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const category = typeof body?.category === 'string' ? body.category.toUpperCase() : ''
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    let contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : ''
    let contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : ''
    const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.trim() : ''
    const bookingHint = typeof body?.bookingHint === 'string' ? body.bookingHint.trim() : ''

    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
    }
    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: 'Objet requis (3 caractères min.)' }, { status: 400 })
    }
    if (!description || description.length < 10) {
      return NextResponse.json({ error: 'Description requise (10 caractères min.)' }, { status: 400 })
    }

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true, email: true, phone: true },
      })
      if (user) {
        if (!contactName) contactName = `${user.firstName} ${user.lastName}`.trim()
        if (!contactEmail) contactEmail = user.email
      }
    }

    if (!contactName || !contactEmail) {
      return NextResponse.json({ error: 'Nom et email de contact requis' }, { status: 400 })
    }

    let reference = generateSupportReference()
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.supportComplaint.findUnique({ where: { reference }, select: { id: true } })
      if (!exists) break
      reference = generateSupportReference()
    }

    const complaint = await prisma.supportComplaint.create({
      data: {
        reference,
        userId: session?.user?.id || null,
        category,
        subject,
        description,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        bookingHint: bookingHint || null,
        status: 'OPEN',
        priority: 'NORMAL',
      },
      select: {
        id: true,
        reference: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Support complaint POST:', error)
    return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 })
  }
}
