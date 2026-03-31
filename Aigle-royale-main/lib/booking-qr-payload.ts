import QRCode from 'qrcode'

/** Contenu encodé dans le QR billet / embarquement (scanné = cette chaîne JSON). */
export type BookingQrPayloadV1 = {
  v: 1
  bookingId: string
  /** Identifiant du groupe multi-billets (si applicable) */
  bookingGroupId: string | null
  ticketNumber: string
  tripId: string
  passengerName: string
  /** Statut réservation : PENDING, CONFIRMED, CANCELLED, etc. */
  bookingStatus: string
  /** Paiement : PAID, PENDING, NONE (pas encore de ligne payment), etc. */
  paymentStatus: string
}

export function buildBookingQrPayload(
  parts: Omit<BookingQrPayloadV1, 'v'>
): BookingQrPayloadV1 {
  return { v: 1, ...parts }
}

export function bookingQrPayloadString(p: BookingQrPayloadV1): string {
  return JSON.stringify(p)
}

export async function bookingQrToDataUrl(p: BookingQrPayloadV1): Promise<string> {
  return QRCode.toDataURL(bookingQrPayloadString(p), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
  })
}

/** Interprète le texte lu par un scanner de QR (ou saisi). */
export function parseBookingQrScan(raw: string): BookingQrPayloadV1 | null {
  const s = raw.trim()
  try {
    const o = JSON.parse(s) as Partial<BookingQrPayloadV1>
    if (o.v === 1 && o.bookingId && o.ticketNumber && o.tripId) {
      return o as BookingQrPayloadV1
    }
    // Ancien format (sans v)
    if (o.bookingId && o.ticketNumber && o.tripId) {
      return {
        v: 1,
        bookingId: String(o.bookingId),
        bookingGroupId: o.bookingGroupId != null ? String(o.bookingGroupId) : null,
        ticketNumber: String(o.ticketNumber),
        tripId: String(o.tripId),
        passengerName: typeof o.passengerName === 'string' ? o.passengerName : '',
        bookingStatus: typeof o.bookingStatus === 'string' ? o.bookingStatus : 'CONFIRMED',
        paymentStatus: typeof o.paymentStatus === 'string' ? o.paymentStatus : 'PAID',
      }
    }
  } catch {
    /* ignore */
  }
  return null
}
