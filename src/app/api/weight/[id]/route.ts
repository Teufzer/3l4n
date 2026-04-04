import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// PATCH /api/weight/[id] — modifier une entrée de poids
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  const entry = await prisma.weightEntry.findUnique({ where: { id } })
  if (!entry) {
    return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
  }
  if (entry.userId !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  let body: { weight?: number; date?: string; note?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { weight, date, note } = body

  if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
    return NextResponse.json({ error: 'Poids invalide' }, { status: 400 })
  }
  if (note !== undefined && note !== null && typeof note === 'string' && note.trim().length > 500) {
    return NextResponse.json({ error: 'La note ne doit pas dépasser 500 caractères' }, { status: 400 })
  }

  const updated = await prisma.weightEntry.update({
    where: { id },
    data: {
      ...(weight !== undefined ? { weight } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(note !== undefined ? { note: note?.trim() || null } : {}),
    },
    select: { id: true, weight: true, date: true, note: true },
  })

  return NextResponse.json({ entry: updated })
}

// DELETE /api/weight/[id] — supprimer une entrée de poids
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  const entry = await prisma.weightEntry.findUnique({ where: { id } })
  if (!entry) {
    return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
  }
  if (entry.userId !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.weightEntry.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
