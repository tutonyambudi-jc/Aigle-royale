import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTrackingCode } from '@/lib/utils'
import * as QRCode from 'qrcode'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Freight creation request body:', JSON.stringify(body, null, 2))

    const {
      tripId,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      weight,
      type,
      value,
      notes,
      agentId,
      originStopId,
      destinationStopId,
    } = body

    // Validation
    const weightNum = parseFloat(weight)
    if (!tripId || !senderName || !senderPhone || !receiverName || !receiverPhone || isNaN(weightNum)) {
      console.error('Validation failed for freight creation:', { tripId, senderName, senderPhone, receiverName, receiverPhone, weight, weightNum })
      return NextResponse.json(
        { error: 'Données manquantes ou poids invalide (doit être un nombre)' },
        { status: 400 }
      )
    }

    // Vérifier que le trajet existe
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip || !trip.isActive) {
      console.error('Trip not found or inactive:', tripId)
      return NextResponse.json(
        { error: 'Trajet non disponible' },
        { status: 400 }
      )
    }

    // Calculer le prix (tarif premium: 10 000 FC par kg)
    const pricePerKg = 10000
    const priceValue = weightNum * pricePerKg

    // Générer le code de suivi
    const trackingCode = generateTrackingCode()

    // Créer la commande de fret
    console.log('Creating freight order in database...')
    const freightOrder = await (prisma.freightOrder.create as any)({
      data: {
        tripId,
        userId: session.user.role === 'CLIENT' ? session.user.id : undefined,
        agentId:
          agentId ||
          (session.user.role === 'AGENT' || session.user.role === 'SUPER_AGENT'
            ? session.user.id
            : null),
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        weight: weightNum,
        type: type || null,
        value: value ? parseFloat(value.toString()) : null,
        price: priceValue,
        trackingCode,
        notes: notes || null,
        status: 'RECEIVED',
        originStopId: originStopId || null,
        destinationStopId: destinationStopId || null,
      },
      select: { id: true, trackingCode: true, price: true, receiverName: true, receiverPhone: true, createdAt: true },
    })

    // Générer le QR Code
    console.log('Generating QR code for tracking code:', freightOrder.trackingCode)
    const qrData = JSON.stringify({
      code: freightOrder.trackingCode,
      name: freightOrder.receiverName,
      phone: freightOrder.receiverPhone,
      date: freightOrder.createdAt,
    })
    const qrCode = await QRCode.toDataURL(qrData)

    console.log('Updating freight order with QR code...')
    await (prisma.freightOrder.update as any)({
      where: { id: freightOrder.id },
      data: { qrCode },
    })

    console.log('Freight order created successfully:', freightOrder.id)
    return NextResponse.json(
      {
        freightOrderId: freightOrder.id,
        trackingCode: freightOrder.trackingCode,
        price: freightOrder.price,
        qrCode,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('CRITICAL ERROR during freight order creation:', error)
    return NextResponse.json(
      { error: error?.message || 'Une erreur est survenue lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get('trackingCode')

    if (trackingCode) {
      // Recherche par code de suivi
      const freightOrder = await prisma.freightOrder.findUnique({
        where: { trackingCode },
        include: {
          trip: {
            include: {
              route: true,
              bus: {
                select: {
                  name: true,
                  plateNumber: true,
                },
              },
            },
          },
          payment: true,
        },
      })

      if (!freightOrder) {
        return NextResponse.json(
          { error: 'Commande introuvable' },
          { status: 404 }
        )
      }

      return NextResponse.json(freightOrder)
    }

    // Liste des commandes selon le rôle
    let where: any = {}
    if (session.user.role === 'CLIENT') {
      where.userId = session.user.id
    } else if (session.user.role === 'AGENT' || session.user.role === 'SUPER_AGENT') {
      where.agentId = session.user.id
    }

    const freightOrders = await prisma.freightOrder.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
            bus: {
              select: {
                name: true,
                plateNumber: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(freightOrders)
  } catch (error) {
    console.error('Freight orders fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
