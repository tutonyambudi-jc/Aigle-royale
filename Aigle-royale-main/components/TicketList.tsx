"use client"
import React from 'react'
import { TicketCard } from './TicketCard'

interface TicketListProps {
  bookings: any[]
  currency: string
}

export function TicketList({ bookings, currency }: TicketListProps) {
  const formatCurrency = (amount: number, curr = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: curr }).format(amount)
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking: any) => (
        <TicketCard key={booking.id} booking={booking} currency={currency} formatCurrency={formatCurrency} />
      ))}
    </div>
  )
}
