import { NextResponse } from 'next/server'
import { getSupportPublicConfig } from '@/lib/support-config'

export async function GET() {
  try {
    const config = await getSupportPublicConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Support config GET:', error)
    return NextResponse.json({ whatsappNumber: '', whatsappPrefill: '' })
  }
}
