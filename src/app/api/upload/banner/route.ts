import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isR2Configured, isAllowedImageType, MAX_SIZE_BYTES } from '@/lib/r2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

// POST /api/upload/banner
// Body: FormData with field "file"
// Returns: { bannerUrl: string }
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

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 10MB)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `banners/${session.user.id}/${randomUUID()}.${ext}`

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

    const bannerUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`

    // Update user bannerUrl in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bannerUrl },
    })

    return NextResponse.json({ bannerUrl })
  } catch (error) {
    console.error('[POST /api/upload/banner]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
