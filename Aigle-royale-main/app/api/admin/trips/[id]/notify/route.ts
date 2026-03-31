
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['ADMINISTRATOR', 'SUPERVISOR', 'AGENT', 'SUPER_AGENT', 'AGENCY_STAFF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        const { message, notifyType } = await request.json() // notifyType: 'DELAY', 'CANCEL', 'INFO'

        if (!message) {
            return NextResponse.json({ error: 'Message requis' }, { status: 400 })
        }

        // Fetch trip and all confirmed/pending bookings
        const trip = await prisma.trip.findUnique({
            where: { id: p.id },
            include: {
                bookings: {
                    where: { status: { in: ['CONFIRMED', 'PENDING'] } }
                },
                route: true
            }
        })

        if (!trip) {
            return NextResponse.json({ error: 'Trajet introuvable' }, { status: 404 })
        }

        // Prepare notifications
        const results = {
            total: trip.bookings.length,
            sentEmail: 0,
            sentSMS: 0,
            failed: 0
        }

        // Process safely
        await Promise.all(trip.bookings.map(async (booking) => {
            try {
                const email = booking.passengerEmail
                const phone = booking.passengerPhone

                // Construct template
                const emailHtml = `
          <h3>Aigle Royal - Information Voyage</h3>
          <p>Bonjour ${booking.passengerName},</p>
          <p>Concernant votre voyage du ${new Date(trip.departureTime).toLocaleDateString('fr-FR')} vers ${trip.route.destination} :</p>
          <div style="padding: 15px; background-color: #f3f4f6; border-left: 4px solid #000; margin: 10px 0;">
            ${message}
          </div>
          <p>Merci de votre compréhension.</p>
        `

                const smsText = `Aigle Royal: Info voyage vers ${trip.route.destination}. ${message.substring(0, 100)}...`

                if (email) {
                    await NotificationService.sendEmail({
                        to: email,
                        subject: 'Information importante sur votre voyage',
                        html: emailHtml
                    })
                    results.sentEmail++
                }

                if (phone) {
                    await NotificationService.sendSMS({
                        to: phone,
                        message: smsText
                    })
                    results.sentSMS++
                }

            } catch (err) {
                console.error('Failed to notify booking', booking.id, err)
                results.failed++
            }
        }))

        return NextResponse.json({ success: true, results })

    } catch (error: any) {
        console.error('Notify error:', error)
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
    }
}
