import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upsertNotification } from '@/lib/notifications'
import { auth } from '@/auth'
import { ReactionType } from '@prisma/client'

const VALID_TYPES: ReactionType[] = ['COURAGE', 'EN_FEU', 'SOLIDAIRE']

// POST /api/posts/[id]/react
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if ((session.user as { banned?: boolean }).banned) {
      return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 })
    }

    // Email verification required
    if (!(session.user as { emailVerified?: unknown }).emailVerified && (session.user as { isCredentialsUser?: boolean }).isCredentialsUser) {
      return NextResponse.json({ error: 'Verifie ton email avant d`effectuer cette action.' }, { status: 403 })
    }


    const { id: postId } = await params
    const body = await req.json()
    const { type } = body

    if (!type || !VALID_TYPES.includes(type as ReactionType)) {
      return NextResponse.json(
        { error: `Type invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check post exists
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const userId = session.user.id

    // Toggle: if reaction exists, remove it; otherwise create it
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId_type: { postId, userId, type: type as ReactionType },
      },
    })

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.reaction.create({
        data: { type: type as ReactionType, postId, userId },
      })

      // Create REACTION notification for the post author (not self)
      if (post.userId !== userId) {
        await upsertNotification({ userId: post.userId, actorId: userId, type: 'REACTION', postId })
      }
    }

    // Return updated reactions for this post
    const reactions = await prisma.reaction.findMany({
      where: { postId },
      select: { id: true, type: true, userId: true },
    })

    return NextResponse.json({ reactions, toggled: !existing })
  } catch (error) {
    console.error('[POST /api/posts/[id]/react]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
