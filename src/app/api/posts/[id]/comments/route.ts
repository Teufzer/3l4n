import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upsertNotification } from '@/lib/notifications'
import { auth } from '@/auth'

// GET /api/posts/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const session = await auth()
    const currentUserId = session?.user?.id ?? null

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true, username: true, verified: true },
        },
        likes: {
          select: { userId: true },
        },
      },
    })

    const normalized = comments.map(({ user, likes, ...rest }) => ({
      ...rest,
      author: user,
      likesCount: likes.length,
      likedByMe: currentUserId ? likes.some((l) => l.userId === currentUserId) : false,
    }))

    return NextResponse.json({ comments: normalized })
  } catch (error) {
    console.error('[GET /api/posts/[id]/comments]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/posts/[id]/comments
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

    const { id: postId } = await params

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const body = await req.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Le commentaire est requis' }, { status: 400 })
    }

    if (content.trim().length > 300) {
      return NextResponse.json({ error: 'Le commentaire ne doit pas dépasser 300 caractères' }, { status: 400 })
    }

    const trimmedContent = content.trim()

    const comment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        userId: session.user.id,
        postId,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true, username: true, verified: true },
        },
      },
    })

    // Create COMMENT notification for the post author (not self)
    if (post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          userId: post.userId,
          actorId: session.user.id,
          postId,
          commentId: comment.id,
        },
      })
    }

    // Detect @mentions and create MENTION notifications
    const mentionMatches = trimmedContent.match(/@([\w]+)/g)
    if (mentionMatches && mentionMatches.length > 0) {
      const usernames = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))]
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: usernames },
          id: { not: session.user.id }, // don't notify self
        },
        select: { id: true },
      })

      for (const mentionedUser of mentionedUsers) {
        // Don't double-notify the post author who already got a COMMENT notif
        if (mentionedUser.id === post.userId) continue
        await prisma.notification.create({
          data: {
            type: 'MENTION',
            userId: mentionedUser.id,
            actorId: session.user.id,
            postId,
            commentId: comment.id,
          },
        })
      }
    }

    const { user, ...rest } = comment
    return NextResponse.json({ comment: { ...rest, author: user } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts/[id]/comments]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
