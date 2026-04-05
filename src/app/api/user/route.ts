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
      height: true,
      email: true,
      avatar: true,
      bannerUrl: true,
      weightPrivate: true,
      profilePrivate: true,
      heightPrivate: true,
      imcPrivate: true,
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
    height?: number | null
    weightPrivate?: boolean
    profilePrivate?: boolean
    heightPrivate?: boolean
    imcPrivate?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { username, name, bio, targetWeight, startWeight, height, weightPrivate, profilePrivate, heightPrivate, imcPrivate } = body

  // Validation
  if (targetWeight !== undefined && targetWeight !== null && (typeof targetWeight !== 'number' || targetWeight <= 0)) {
    return NextResponse.json({ error: 'Objectif de poids invalide' }, { status: 400 })
  }
  if (startWeight !== undefined && startWeight !== null && (typeof startWeight !== 'number' || startWeight <= 0)) {
    return NextResponse.json({ error: 'Poids de départ invalide' }, { status: 400 })
  }
  if (height !== undefined && height !== null && (typeof height !== 'number' || height < 100 || height > 250)) {
    return NextResponse.json({ error: 'Taille invalide (entre 100 et 250 cm)' }, { status: 400 })
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
  if (name !== undefined) {
    const trimmedName = name?.trim() || null
    if (trimmedName !== null) {
      if (trimmedName.length < 1) return NextResponse.json({ error: 'Le nom ne peut pas être vide' }, { status: 400 })
      if (trimmedName.length > 100) return NextResponse.json({ error: 'Le nom ne doit pas dépasser 100 caractères' }, { status: 400 })
    }
    updateData.name = trimmedName
  }
  if (bio !== undefined) {
    const trimmedBio = bio?.trim() || null
    if (trimmedBio !== null && trimmedBio.length > 200) {
      return NextResponse.json({ error: 'La bio ne doit pas dépasser 200 caractères' }, { status: 400 })
    }
    updateData.bio = trimmedBio
  }
  if (targetWeight !== undefined) updateData.targetWeight = targetWeight
  if (startWeight !== undefined) updateData.startWeight = startWeight
  if (height !== undefined) updateData.height = height
  if (weightPrivate !== undefined) {
    if (typeof weightPrivate !== 'boolean') return NextResponse.json({ error: 'weightPrivate doit être un booléen' }, { status: 400 })
    updateData.weightPrivate = weightPrivate
  }
  if (profilePrivate !== undefined) {
    if (typeof profilePrivate !== 'boolean') return NextResponse.json({ error: 'profilePrivate doit être un booléen' }, { status: 400 })
    updateData.profilePrivate = profilePrivate
  }
  if (heightPrivate !== undefined) {
    if (typeof heightPrivate !== 'boolean') return NextResponse.json({ error: 'heightPrivate doit être un booléen' }, { status: 400 })
    updateData.heightPrivate = heightPrivate
  }
  if (imcPrivate !== undefined) {
    if (typeof imcPrivate !== 'boolean') return NextResponse.json({ error: 'imcPrivate doit être un booléen' }, { status: 400 })
    updateData.imcPrivate = imcPrivate
  }

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
      height: true,
      weightPrivate: true,
      profilePrivate: true,
      heightPrivate: true,
      imcPrivate: true,
    },
  })

  return NextResponse.json({ user })
}
