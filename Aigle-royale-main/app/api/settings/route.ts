import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Clé requise' }, { status: 400 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key }
    })

    if (!setting) {
      // Return default values for known settings
      if (key === 'seatSelectionKey') {
        return NextResponse.json({ key, value: 'id' })
      }
      if (key === 'serviceFeeEnabled') {
        return NextResponse.json({ key, value: 'false' })
      }
      if (key === 'serviceFeeMode') {
        return NextResponse.json({ key, value: 'NONE' })
      }
      if (key === 'serviceFeeValue') {
        return NextResponse.json({ key, value: '0' })
      }
      return NextResponse.json({ error: 'Paramètre non trouvé' }, { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error fetching setting:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
