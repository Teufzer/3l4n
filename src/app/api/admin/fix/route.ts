import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await prisma.user.update({
    where: { id: 'cmnjo2q05000023ltra2bf2fa' },
    data: { startWeight: 193.0 },
  })
  return NextResponse.json({ ok: true })
}
