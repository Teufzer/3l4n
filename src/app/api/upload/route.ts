import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isR2Configured, isAllowedImageType, MAX_SIZE_BYTES } from '@/lib/r2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { rateLimit } from '@/lib/rateLimit'

function validateImageBytes(buffer: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true
  return false
}

// POST /api/upload
// Body: FormData with field "file"
// Returns: { publicUrl: string }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limit: 20 uploads par user par heure
    if (!await rateLimit(`upload:${session.user.id}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Trop d’uploads. Réessaie dans un moment.' }, { status: 429 })
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Upload non configuré' }, { status: 503 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        { error: 'Format non autorisé. Acceptés : jpg, png, gif, webp' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 10MB)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `posts/${session.user.id}/${randomUUID()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!validateImageBytes(buffer)) {
      return NextResponse.json({ error: 'Fichier invalide (signature binaire non reconnue)' }, { status: 400 })
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    const publicUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`

    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
