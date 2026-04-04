import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/profile/[id] — update name and bio
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Only allow users to edit their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { name, bio } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Le nom ne doit pas dépasser 50 caractères' }, { status: 400 })
    }

    if (bio && typeof bio === 'string' && bio.trim().length > 200) {
      return NextResponse.json({ error: 'La bio ne doit pas dépasser 200 caractères' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        bio: bio ? bio.trim() : null,
      },
      select: {
        id: true,
        name: true,
        bio: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[PATCH /api/profile/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
