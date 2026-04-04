import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase()

  if (!q) {
    return NextResponse.json({ error: 'Paramètre q manquant' }, { status: 400 })
  }

  if (!USERNAME_REGEX.test(q)) {
    return NextResponse.json(
      { available: false, suggestions: [], error: 'Format invalide (3-30 caractères, lettres, chiffres, _)' },
      { status: 200 }
    )
  }

  const existing = await prisma.user.findUnique({
    where: { username: q },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ available: true, suggestions: [] })
  }

  // Generate suggestions and check availability
  const candidates = [
    `${q}1`,
    `${q}2`,
    `${q}2026`,
    `_${q}`,
    `${q}_`,
  ]

  const taken = await prisma.user.findMany({
    where: { username: { in: candidates } },
    select: { username: true },
  })

  const takenSet = new Set(taken.map((u) => u.username))
  const suggestions = candidates.filter((c) => !takenSet.has(c)).slice(0, 3)

  return NextResponse.json({ available: false, suggestions })
}
