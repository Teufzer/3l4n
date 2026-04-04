import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isR2Configured, isAllowedImageType, generatePresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

// POST /api/upload
// Body: { filename: string, contentType: string }
// Returns: { uploadUrl: string, publicUrl: string }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Upload non configuré' }, { status: 503 })
    }

    const body = await req.json()
    const { filename, contentType } = body

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Nom de fichier requis' }, { status: 400 })
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Type de contenu requis' }, { status: 400 })
    }

    if (!isAllowedImageType(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : jpg, png, gif, webp' },
        { status: 400 }
      )
    }

    // Build a safe key: userId/uuid.ext
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `posts/${session.user.id}/${randomUUID()}.${ext}`

    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(key, contentType)

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
