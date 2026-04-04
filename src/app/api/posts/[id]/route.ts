import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/posts/[id] — public, returns post with author + reactions + comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            image: true,
          },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true, image: true },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const { user, comments, ...rest } = post

    const normalized = {
      ...rest,
      author: user,
      comments: comments.map(({ user: commentUser, ...c }) => ({
        ...c,
        author: commentUser,
      })),
    }

    return NextResponse.json({ post: normalized })
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
