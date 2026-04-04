import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results: string[] = []
  const run = async (sql: string, label: string) => {
    try { await prisma.$executeRawUnsafe(sql); results.push('OK: ' + label) }
    catch (e: unknown) { results.push('SKIP: ' + label + ' — ' + String(e).slice(0, 60)) }
  }

  // Follow table
  await run(`CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "followingId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("followerId", "followingId")
  )`, 'Follow table')

  // Block table
  await run(`CREATE TABLE IF NOT EXISTS "Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "blockedId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("blockerId", "blockedId")
  )`, 'Block table')

  // Add FOLLOW to NotifType enum
  await run(`ALTER TYPE "NotifType" ADD VALUE IF NOT EXISTS 'FOLLOW'`, 'NotifType FOLLOW')

  // verified column
  await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false`, 'User.verified')

  return NextResponse.json({ ok: true, results })
}
