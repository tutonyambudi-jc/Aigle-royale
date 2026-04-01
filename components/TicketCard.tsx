"use client"

import React from 'react'
import { QrCode, User, Armchair, Calendar, Clock, MapPin, Ticket as TicketIcon } from 'lucide-react'
import * as QRCode from 'qrcode'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TicketCardProps {
  booking: any
  currency: string
  formatCurrency: (amount: number) => string
}

export function TicketCard({ booking, currency, formatCurrency }: TicketCardProps) {
  const [qrUrl, setQrUrl] = React.useState('');
  React.useEffect(() => {
    if (booking.ticketNumber) {
      QRCode.toDataURL(booking.ticketNumber, { width: 128, margin: 0, color: { dark: '#2e1065', light: '#fff' } })
        .then(setQrUrl)
        .catch(() => setQrUrl(''));
    }
  }, [booking.ticketNumber]);
  return (
    <div className="relative max-w-xl mx-auto bg-gradient-to-br from-blue-900 via-indigo-700 to-fuchsia-600 rounded-3xl shadow-2xl border-4 border-fuchsia-400 flex flex-col md:flex-row overflow-hidden mb-8">
      {/* Bordure pointillée effet détachable */}
      <div className="absolute top-0 right-24 h-full w-8 hidden md:block">
        <div className="h-full border-r-2 border-dashed border-fuchsia-200"></div>
      </div>
      {/* Partie gauche principale */}
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <TicketIcon className="w-5 h-5 text-fuchsia-200" />
          <span className="font-mono text-xs text-fuchsia-100">{booking.ticketNumber}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-white/80" />
          <span className="font-bold text-lg text-white drop-shadow">{booking.passengerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Armchair className="w-5 h-5 text-fuchsia-200" />
          <span className="font-semibold text-fuchsia-100">Siège {booking.seat.seatNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-white/80" />
          <span className="text-white/90 font-semibold">{booking.trip.route.origin} → {booking.trip.route.destination}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white/80" />
          <span className="text-white/90">{format(new Date(booking.trip.departureTime), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/80" />
          <span className="text-white/90">Départ à {format(new Date(booking.trip.departureTime), 'HH:mm')}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-fuchsia-100">Type:</span>
          <span className="font-semibold text-white">
            {booking.passengerType === 'ADULT' ? 'Adulte' : booking.passengerType === 'CHILD' ? 'Enfant' : booking.passengerType === 'INFANT' ? 'Bébé' : 'Senior'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-fuchsia-100">Prix:</span>
          <span className="font-bold text-yellow-300 text-2xl drop-shadow">{formatCurrency(booking.totalPrice)}</span>
        </div>
      </div>
      {/* Partie droite QR code */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-blue-100 px-6 py-8 md:min-w-[180px] gap-2">
        <div className="rounded-xl bg-white p-2 shadow-md border-2 border-fuchsia-200">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code billet" className="w-24 h-24" />
          ) : (
            <QrCode className="w-24 h-24 text-fuchsia-200" />
          )}
        </div>
        <span className="text-[10px] text-fuchsia-400 font-mono mt-2">{booking.ticketNumber}</span>
      </div>
    </div>
  );
}
