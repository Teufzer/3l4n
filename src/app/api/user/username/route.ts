import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/

export async function PATCH(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { username } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username requis' }, { status: 400 })
    }

    const normalizedUsername = username.trim().toLowerCase()

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return NextResponse.json(
        { error: 'Le @username doit faire 3 à 30 caractères (lettres, chiffres, _)' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    })

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: 'Ce @username est déjà pris' }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { username: normalizedUsername },
      select: { id: true, username: true },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Username update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
