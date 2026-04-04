import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const OLD = 'https://pub-9d6f6e9607974719a3e0e70976462a7c.r2.dev'
  const NEW = 'https://cdn.3l4n.com'

  const [posts, avatars, banners] = await Promise.all([
    prisma.$executeRawUnsafe(`UPDATE "Post" SET "imageUrl" = REPLACE("imageUrl", '${OLD}', '${NEW}') WHERE "imageUrl" LIKE '${OLD}%'`),
    prisma.$executeRawUnsafe(`UPDATE "User" SET "avatar" = REPLACE("avatar", '${OLD}', '${NEW}') WHERE "avatar" LIKE '${OLD}%'`),
    prisma.$executeRawUnsafe(`UPDATE "User" SET "bannerUrl" = REPLACE("bannerUrl", '${OLD}', '${NEW}') WHERE "bannerUrl" LIKE '${OLD}%'`),
  ])

  return NextResponse.json({ posts, avatars, banners })
}
