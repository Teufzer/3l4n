import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = await req.json()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { banned: false },
    select: { username: true, banned: true }
  })
  return NextResponse.json({ user })
}
