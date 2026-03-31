import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key }
      })
      
      return NextResponse.json(setting)
    }

    const settings = await prisma.setting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { key, value } = await request.json()

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: 'Clé et valeur requises' }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
