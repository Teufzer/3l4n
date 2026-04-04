import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isR2Configured, isAllowedImageType } from '@/lib/r2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024 // 5MB

// POST /api/upload/avatar
// Body: FormData with field "file"
// Returns: { avatarUrl: string }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Upload non disponible — R2 non configuré' },
        { status: 503 }
      )
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

    if (file.size > AVATAR_MAX_BYTES) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 5MB)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `avatars/${session.user.id}/${randomUUID()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const avatarUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`

    // Update user avatar in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('[POST /api/upload/avatar]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
