import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_FREIGHT_PRICE_PER_KG_FC, resolveFreightPricePerKg } from '@/lib/freight-pricing'

/** Plage indicative des tarifs fret (FC/kg) pour le simulateur public — sans auth. */
export async function GET() {
  try {
    const companies = await prisma.busCompany.findMany({
      select: { freightPricePerKg: true },
    })
    const prices = companies.map((c) => resolveFreightPricePerKg(c))
    if (prices.length === 0) {
      return NextResponse.json({
        min: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
        max: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
        defaultPricePerKg: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
      })
    }
    return NextResponse.json({
      min: Math.min(...prices),
      max: Math.max(...prices),
      defaultPricePerKg: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
    })
  } catch (e) {
    console.error('freight pricing-summary:', e)
    return NextResponse.json(
      {
        min: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
        max: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
        defaultPricePerKg: DEFAULT_FREIGHT_PRICE_PER_KG_FC,
      },
      { status: 200 }
    )
  }
}
