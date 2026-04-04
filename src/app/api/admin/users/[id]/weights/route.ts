import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [deleted] = await prisma.$transaction([
    prisma.weightEntry.deleteMany({ where: { userId: id } }),
    prisma.user.update({
      where: { id },
      data: { startWeight: null },
    }),
  ])

  return NextResponse.json({ deleted: deleted.count })
}
