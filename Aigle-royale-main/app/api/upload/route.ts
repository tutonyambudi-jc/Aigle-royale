import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateUploadedFile } from '@/lib/upload-validate'

function canUploadFiles(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !canUploadFiles(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const validated = validateUploadedFile(buffer, file.type || 'application/octet-stream')
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const fileName = `${randomUUID()}.${validated.extension}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const path = join(uploadDir, fileName)

    await writeFile(path, buffer)

    return NextResponse.json({
      success: true,
      url: `/uploads/${fileName}`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur lors de l’upload' }, { status: 500 })
  }
}
