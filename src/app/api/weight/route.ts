import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { auth } from '@/auth'

// GET /api/weight — récupère les entrées de poids de l'utilisateur connecté
export async function GET() {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      weight: true,
      date: true,
      note: true,
    },
  })

  return NextResponse.json({ entries })
}

// POST /api/weight — ajoute une entrée de poids
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if ((session!.user as { banned?: boolean }).banned) {
    return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 })
  }

  let body: { weight: number; date?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { weight, date, note } = body

  if (!weight || typeof weight !== 'number' || weight <= 0) {
    return NextResponse.json({ error: 'Poids invalide' }, { status: 400 })
  }

  if (note && typeof note === 'string' && note.trim().length > 500) {
    return NextResponse.json({ error: 'La note ne doit pas dépasser 500 caractères' }, { status: 400 })
  }

  // Vérifier qu'il n'y a pas déjà une pesée ce jour calendaire
  const targetDate = date ? new Date(date) : new Date()
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
    return NextResponse.json(
      { error: "Tu as déjà enregistré une pesée aujourd'hui. Modifie-la si besoin." },
      { status: 409 }
    )
  }

  const entry = await prisma.weightEntry.create({
    data: {
      userId,
      weight,
      date: date ? new Date(date) : new Date(),
      note: note?.trim() || null,
    },
    select: {
      id: true,
      weight: true,
      date: true,
      note: true,
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
