import { prisma } from '@/lib/prisma'
import { buildBookingQrPayload, bookingQrToDataUrl } from '@/lib/booking-qr-payload'

function resolvePaymentStatus(
  bookingPayment: { status: string } | null | undefined,
  group: {
    paymentStatus: string
    payment: { status: string } | null
  } | null | undefined
): string {
  if (bookingPayment?.status) return bookingPayment.status
  if (group?.payment?.status) return group.payment.status
  if (group?.paymentStatus) return group.paymentStatus
  return 'NONE'
}

/** Recalcule l’image QR (data URL) à partir des données à jour (ex. après paiement). */
export async function regenerateBookingQrForId(bookingId: string): Promise<void> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      bookingGroup: { include: { payment: true } },
    },
  })
  if (!b) return

  const paymentStatus = resolvePaymentStatus(b.payment, b.bookingGroup ?? undefined)

  const payload = buildBookingQrPayload({
    bookingId: b.id,
    bookingGroupId: b.bookingGroupId,
    ticketNumber: b.ticketNumber,
    tripId: b.tripId,
    passengerName: b.passengerName,
    bookingStatus: b.status,
    paymentStatus,
  })

  const qrCode = await bookingQrToDataUrl(payload)
  await prisma.booking.update({
    where: { id: bookingId },
    data: { qrCode },
  })
}
