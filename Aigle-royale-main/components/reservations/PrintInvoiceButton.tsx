'use client'

import { Printer } from 'lucide-react'

interface PrintInvoiceButtonProps {
    bookingId: string
}

export function PrintInvoiceButton({ bookingId }: PrintInvoiceButtonProps) {
    return (
        <button
            onClick={() => window.open(`/bookings/${bookingId}/confirmation?facture=true&print=true`, '_blank')}
            className="text-xs font-black text-gray-500 hover:text-primary-600 transition-colors text-center flex items-center justify-center gap-1"
        >
            <Printer className="w-3 h-3" />
            Imprimer facture
        </button>
    )
}
