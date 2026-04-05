import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upsertNotification } from '@/lib/notifications'
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
          where: { followerId: currentUserId, status: 'ACCEPTED' },
          select: { followingId: true },
        }),
      ])

      blockedUserIds = blocks.map((b) =>
        b.blockerId === currentUserId ? b.blockedId : b.blockerId
      )
      followedUserIds = follows.map((f) => f.followingId)
    } else if (!currentUserId && !userId) {
      // Unauthenticated: need to know accepted follows (none for anon)
      followedUserIds = []
    }

    // When fetching a user's profile posts, also include posts they reposted
    if (userId) {
      // Fetch own posts
      const ownPosts = await prisma.post.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: { userId, user: { banned: false } },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true, image: true, verified: true, banned: true },
          },
          reactions: { select: { id: true, type: true, userId: true } },
          _count: { select: { comments: true, reposts: true } },
          reposts: { select: { userId: true } },
        },
      })

      // Fetch reposts by this user (excluding posts from banned users)
      const userReposts = await prisma.repost.findMany({
        where: { userId, post: { user: { banned: false } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          post: {
            include: {
              user: {
                select: { id: true, name: true, username: true, avatar: true, image: true, verified: true, banned: true },
              },
              reactions: { select: { id: true, type: true, userId: true } },
              _count: { select: { comments: true, reposts: true } },
              reposts: { select: { userId: true } },
            },
          },
        },
      })

      const normalizedOwn = ownPosts.map(({ user, reposts, _count, ...rest }) => ({
        ...rest,
        author: user,
        repostsCount: reposts.length,
        repostedByMe: currentUserId ? reposts.some((r) => r.userId === currentUserId) : false,
        commentsCount: _count?.comments ?? 0,
        isRepost: false as const,
        reposterId: null as string | null,
        repostedAt: null as string | null,
      }))

      const normalizedReposts = userReposts
        .map(({ post, createdAt, userId: reposterId }) => {
          const { user, reposts, _count, ...rest } = post
          return {
            ...rest,
            author: user,
            repostsCount: reposts.length,
            repostedByMe: currentUserId ? reposts.some((r) => r.userId === currentUserId) : false,
            commentsCount: _count?.comments ?? 0,
            isRepost: true as const,
            reposterId,
            repostedAt: createdAt.toISOString(),
          }
        })

      // Merge and sort by createdAt (posts) / repostedAt (reposts) descending
      const merged = [...normalizedOwn, ...normalizedReposts]
        .sort((a, b) => {
          const dateA = a.isRepost ? new Date(a.repostedAt!).getTime() : new Date(a.createdAt).getTime()
          const dateB = b.isRepost ? new Date(b.repostedAt!).getTime() : new Date(b.createdAt).getTime()
          return dateB - dateA
        })
        .slice(0, limit)

      return NextResponse.json({ posts: merged, page, limit })
    }

    // Get IDs of private users NOT followed by current user
    // Private profile posts should only appear if the current user follows them (ACCEPTED)
    const privateUserFilter = await (async () => {
      // Find all private users
      const privateUsers = await prisma.user.findMany({
        where: { profilePrivate: true, banned: false },
        select: { id: true },
      })
      // Filter out those the current user follows (accepted)
      const privateUserIds = privateUsers
        .map((u) => u.id)
        .filter((id) => !followedUserIds.includes(id))
        // Also exclude the current user themselves (they see their own posts)
        .filter((id) => id !== currentUserId)
      return privateUserIds
    })()

    const excludedIds = [
      ...blockedUserIds,
      ...privateUserFilter,
    ]

    const whereClause = {
      user: { banned: false },
      ...(excludedIds.length > 0
        ? { userId: { notIn: excludedIds } }
        : {}),
    }

    // Feed purement chronologique — pas de tri par follows, juste date desc

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, image: true, verified: true, banned: true },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
        _count: {
          select: { comments: true, reposts: true }
        },
        reposts: {
          select: { userId: true },
        },
      },
    })

    // Normalize: expose user as "author" for frontend
    const normalized = posts.map(({ user, reposts, _count, ...rest }) => ({
      ...rest,
      author: user,
      repostsCount: reposts.length,
      repostedByMe: currentUserId ? reposts.some((r) => r.userId === currentUserId) : false,
      commentsCount: _count?.comments ?? 0,
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

    // Email verification required to post
    if (!session.user.emailVerified && (session.user as { isCredentialsUser?: boolean }).isCredentialsUser) {
      return NextResponse.json({ error: 'Verifie ton email avant de publier.' }, { status: 403 })
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
          select: { id: true, name: true, username: true, avatar: true, image: true, verified: true, banned: true },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
        _count: {
          select: { comments: true, reposts: true }
        },
        reposts: {
          select: { userId: true },
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

      for (const u of mentionedUsers) {
        await upsertNotification({ userId: u.id, actorId: session.user.id, type: 'MENTION', postId: post.id })
      }
    }

    const { user, reposts, ...rest } = post
    return NextResponse.json({ post: { ...rest, author: user, repostsCount: 0, repostedByMe: false } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
