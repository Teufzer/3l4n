import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Add username column if missing
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;`)
    // Set username for TeufeurS
    await prisma.$executeRawUnsafe(`UPDATE "User" SET username = 'teuf' WHERE id = 'cmnjo2q05000023ltra2bf2fa' AND (username IS NULL OR username = '');`)
    const user = await prisma.user.findUnique({ where: { id: 'cmnjo2q05000023ltra2bf2fa' }, select: { username: true } })
    return NextResponse.json({ ok: true, username: user?.username })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
