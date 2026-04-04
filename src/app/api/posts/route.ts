import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/posts?page=1&limit=10&userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit
    const userId = searchParams.get('userId')

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: {
        user: { banned: false },
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
      },
    })

    // Normalize: expose user as "author" for frontend
    const normalized = posts.map(({ user, ...rest }) => ({
      ...rest,
      author: user,
    }))

    return NextResponse.json({ posts: normalized, page, limit })
  } catch (error) {
    console.error('[GET /api/posts]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.banned) {
      return NextResponse.json({ error: 'Ton compte est suspendu' }, { status: 403 })
    }

    const body = await req.json()
    const { content, imageUrl } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: 'Le post ne doit pas dépasser 500 caractères' }, { status: 400 })
    }

    // Validate imageUrl if provided
    const safeImageUrl = imageUrl && typeof imageUrl === 'string' ? imageUrl : null

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        ...(safeImageUrl ? { imageUrl: safeImageUrl } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, image: true },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
      },
    })

    // Detect @mentions and create MENTION notifications
    const mentionRegex = /@(\w+)/g
    const mentionedUsernames = [...new Set(
      [...content.matchAll(mentionRegex)].map((m) => m[1].toLowerCase())
    )]

    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames, mode: 'insensitive' },
          NOT: { id: session.user.id },
        },
        select: { id: true },
      })

      if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
          data: mentionedUsers.map((u) => ({
            type: 'MENTION' as const,
            userId: u.id,
            actorId: session.user.id,
            postId: post.id,
          })),
          skipDuplicates: true,
        })
      }
    }

    const { user, ...rest } = post
    return NextResponse.json({ post: { ...rest, author: user } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
