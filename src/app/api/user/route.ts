import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/user — récupère le profil de l'utilisateur connecté
export async function GET() {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      targetWeight: true,
      startWeight: true,
      email: true,
      avatar: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

// PATCH /api/user — met à jour le profil
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: {
    username?: string
    name?: string
    bio?: string
    targetWeight?: number | null
    startWeight?: number | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { username, name, bio, targetWeight, startWeight } = body

  // Validation
  if (targetWeight !== undefined && targetWeight !== null && (typeof targetWeight !== 'number' || targetWeight <= 0)) {
    return NextResponse.json({ error: 'Objectif de poids invalide' }, { status: 400 })
  }
  if (startWeight !== undefined && startWeight !== null && (typeof startWeight !== 'number' || startWeight <= 0)) {
    return NextResponse.json({ error: 'Poids de départ invalide' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (username !== undefined) {
    const u = username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || null
    if (u && u.length < 3) return NextResponse.json({ error: 'Username trop court (min 3 caractères)' }, { status: 400 })
    if (u && u.length > 30) return NextResponse.json({ error: 'Username trop long (max 30 caractères)' }, { status: 400 })
    // Check uniqueness
    if (u) {
      const existing = await prisma.user.findUnique({ where: { username: u } })
      if (existing && existing.id !== userId) return NextResponse.json({ error: 'Ce @username est déjà pris' }, { status: 400 })
    }
    updateData.username = u
  }
  if (name !== undefined) updateData.name = name?.trim() || null
  if (bio !== undefined) updateData.bio = bio?.trim() || null
  if (targetWeight !== undefined) updateData.targetWeight = targetWeight
  if (startWeight !== undefined) updateData.startWeight = startWeight

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      targetWeight: true,
      startWeight: true,
    },
  })

  return NextResponse.json({ user })
}
