import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/posts/[id]/comments/[commentId]/like — toggle like
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { commentId } = await params
    const userId = session.user.id

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
    }

    // No self-like
    if (comment.userId === userId) {
      return NextResponse.json({ error: 'Tu ne peux pas liker ton propre commentaire' }, { status: 403 })
    }

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    })

    let liked: boolean

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } })
      liked = false
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } })
      liked = true
    }

    const count = await prisma.commentLike.count({ where: { commentId } })

    return NextResponse.json({ liked, count })
  } catch (error) {
    console.error('[POST /api/posts/[id]/comments/[commentId]/like]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
