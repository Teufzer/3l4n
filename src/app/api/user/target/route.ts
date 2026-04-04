import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// POST /api/user/target — update target weight
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: { targetWeight?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { targetWeight } = body

  if (!targetWeight || typeof targetWeight !== 'number' || targetWeight <= 0) {
    return NextResponse.json({ error: 'Objectif invalide' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { targetWeight },
    select: { id: true, targetWeight: true },
  })

  return NextResponse.json({ user })
}
