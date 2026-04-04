import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userIds, deleteWeights } = await req.json()

  const results = []
  for (const userId of userIds) {
    if (deleteWeights) {
      await prisma.weightEntry.deleteMany({ where: { userId } })
      await prisma.user.update({ where: { id: userId }, data: { startWeight: null } })
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned: true },
      select: { username: true, banned: true }
    })
    results.push(user)
  }
  return NextResponse.json({ results })
}
