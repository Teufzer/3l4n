import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rateLimit'

// GET /api/posts?page=1&limit=10&userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit
    const userId = searchParams.get('userId')

    const session = await auth()
    const currentUserId = session?.user?.id ?? null

    // Build block/follow filters for authenticated users browsing the general feed
    let blockedUserIds: string[] = []
    let followedUserIds: string[] = []

    if (currentUserId && !userId) {
      const [blocks, follows] = await Promise.all([
        prisma.block.findMany({
          where: {
            OR: [
              { blockerId: currentUserId },
              { blockedId: currentUserId },
            ],
          },
          select: { blockerId: true, blockedId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        }),
      ])

      blockedUserIds = blocks.map((b) =>
        b.blockerId === currentUserId ? b.blockedId : b.blockerId
      )
      followedUserIds = follows.map((f) => f.followingId)
    }

    const whereClause = {
      user: { banned: false },
      ...(userId
        ? { userId }
        : blockedUserIds.length > 0
        ? { userId: { notIn: blockedUserIds } }
        : {}),
    }

    // If viewing general feed as authenticated user with follows, fetch more to reorder
    if (currentUserId && !userId && followedUserIds.length > 0) {
      // Fetch a larger set and sort: followed users first, then by date desc
      const fetchLimit = Math.min(limit * 5, 200)
      const allPosts = await prisma.post.findMany({
        skip,
        take: fetchLimit,
        orderBy: { createdAt: 'desc' },
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true, image: true, verified: true },
          },
          reactions: {
            select: { id: true, type: true, userId: true },
          },
        },
      })

      const followedSet = new Set(followedUserIds)
      const followed = allPosts.filter((p) => followedSet.has(p.userId))
      const others = allPosts.filter((p) => !followedSet.has(p.userId))
      const sorted = [...followed, ...others].slice(0, limit)

      const normalized = sorted.map(({ user, ...rest }) => ({ ...rest, author: user }))
      return NextResponse.json({ posts: normalized, page, limit })
    }

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, image: true, verified: true },
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

    // Rate limit: 30 posts par user par heure
    if (!await rateLimit(`post:${session.user.id}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Trop de posts. Réessaie dans un moment.' }, { status: 429 })
    }

    const body = await req.json()
    const { content, imageUrl } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: 'Le post ne doit pas dépasser 500 caractères' }, { status: 400 })
    }

    // Validate imageUrl: must come from R2
    if (imageUrl && typeof imageUrl === 'string') {
      const r2Base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
      if (!r2Base || !imageUrl.startsWith(r2Base + '/')) {
        return NextResponse.json({ error: "URL d'image invalide" }, { status: 400 })
      }
    }

    const safeImageUrl = imageUrl && typeof imageUrl === 'string' ? imageUrl : null

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        ...(safeImageUrl ? { imageUrl: safeImageUrl } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, image: true, verified: true },
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
