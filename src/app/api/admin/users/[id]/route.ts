import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // Prevent self-ban
  if (body.banned !== undefined && id === session.user.id) {
    return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.banned !== undefined) updateData.banned = body.banned
  if (body.verified !== undefined) updateData.verified = body.verified

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, banned: true, verified: true },
  })

  return NextResponse.json({ user })
}
