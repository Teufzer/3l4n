import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results: string[] = []
  const run = async (sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); results.push('OK: ' + sql.slice(0, 60)) }
    catch (e: unknown) { results.push('SKIP: ' + String(e).slice(0, 80)) }
  }

  await run(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP;`)
  await run(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "originalContent" TEXT;`)
  await run(`CREATE TYPE IF NOT EXISTS "NotifType" AS ENUM ('MENTION', 'REACTION', 'COMMENT');`)
  await run(`CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "NotifType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "actorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT REFERENCES "Post"("id") ON DELETE CASCADE,
    "commentId" TEXT REFERENCES "Comment"("id") ON DELETE CASCADE
  );`)
  await run(`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");`)

  return NextResponse.json({ ok: true, results })
}
