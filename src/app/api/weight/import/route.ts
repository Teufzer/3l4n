import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

interface ImportEntry {
  weight: number
  date: string
  note?: string
}

// POST /api/weight/import — importe des pesées passées (max 100)
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if ((session!.user as { banned?: boolean }).banned) {
    return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 })
  }

  let body: { entries: ImportEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { entries } = body

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'Aucune entrée fournie' }, { status: 400 })
  }

  if (entries.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 entrées par import' }, { status: 400 })
  }

  // Valider les entrées
  for (const entry of entries) {
    if (typeof entry.weight !== 'number' || entry.weight <= 0 || entry.weight > 500) {
      return NextResponse.json({ error: `Poids invalide : ${entry.weight}` }, { status: 400 })
    }
    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      return NextResponse.json({ error: `Date invalide : ${entry.date}` }, { status: 400 })
    }
    if (entry.note && entry.note.length > 500) {
      return NextResponse.json({ error: 'Une note dépasse 500 caractères' }, { status: 400 })
    }
  }

  let imported = 0
  let skipped = 0

  for (const entry of entries) {
    const targetDate = new Date(entry.date)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.weightEntry.findFirst({
      where: {
        userId,
        date: { gte: dayStart, lte: dayEnd },
      },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.weightEntry.create({
      data: {
        userId,
        weight: entry.weight,
        date: targetDate,
        note: entry.note?.trim() || null,
      },
    })
    imported++
  }

  return NextResponse.json({ imported, skipped }, { status: 200 })
}
