import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const fileExtension = file.name.split('.').pop()
        const fileName = `${randomUUID()}.${fileExtension}`
        const path = join(process.cwd(), 'public', 'uploads', fileName)

        await writeFile(path, buffer)

        return NextResponse.json({
            success: true,
            url: `/uploads/${fileName}`
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Erreur lors de l’upload' }, { status: 500 })
    }
}
