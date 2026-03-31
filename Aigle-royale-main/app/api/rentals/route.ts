import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Créer une demande de location
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const {
            rentalType,
            startDate,
            endDate,
            startTime,
            endTime,
            departureLocation,
            destination,
            stops,
            passengerCount,
            preferredBusType,
            specialRequests,
            contactName,
            contactPhone,
            contactEmail,
        } = body

        // Validation
        if (!rentalType || !startDate || !endDate || !departureLocation || !destination || !passengerCount) {
            return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
        }

        if (!['FULL_DAY', 'HALF_DAY'].includes(rentalType)) {
            return NextResponse.json({ error: 'Type de location invalide' }, { status: 400 })
        }

        // Calculer le prix de base
        const dailyRate = 150000 // FC
        const halfDayRate = 80000 // FC
        const pricePerKm = 500 // FC
        const vipSupplement = 50000 // FC

        let basePrice = rentalType === 'FULL_DAY' ? dailyRate : halfDayRate

        // Ajouter le coût de la distance si fourni
        if (body.estimatedDistance) {
            basePrice += body.estimatedDistance * pricePerKm
        }

        // Ajouter le supplément VIP si demandé
        if (preferredBusType === 'VIP') {
            basePrice += vipSupplement
        }

        const priceDetails = JSON.stringify({
            baseRate: rentalType === 'FULL_DAY' ? dailyRate : halfDayRate,
            distanceCost: body.estimatedDistance ? body.estimatedDistance * pricePerKm : 0,
            vipSupplement: preferredBusType === 'VIP' ? vipSupplement : 0,
        })

        // Créer la demande
        const rental = await prisma.busRental.create({
            data: {
                userId: session.user.id,
                contactName,
                contactPhone,
                contactEmail,
                rentalType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                startTime,
                endTime,
                departureLocation,
                destination,
                stops: stops ? JSON.stringify(stops) : null,
                estimatedDistance: body.estimatedDistance || null,
                passengerCount,
                preferredBusType,
                specialRequests,
                basePrice,
                priceDetails,
            },
        })

        return NextResponse.json({
            success: true,
            rental: {
                id: rental.id,
                rentalType: rental.rentalType,
                startDate: rental.startDate,
                endDate: rental.endDate,
                basePrice: rental.basePrice,
                status: rental.status,
            },
        })
    } catch (error: any) {
        console.error('Rental creation error:', error)
        return NextResponse.json({ error: error.message || 'Une erreur est survenue' }, { status: 500 })
    }
}

// GET: Liste des demandes du client connecté
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const rentals = await prisma.busRental.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                bus: {
                    select: {
                        name: true,
                        plateNumber: true,
                        seatType: true,
                    },
                },
                driver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(rentals)
    } catch (error) {
        console.error('Rentals fetch error:', error)
        return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
    }
}
