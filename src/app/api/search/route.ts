import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/search?q=xxx&type=users|posts|all
// Public — no auth required
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') ?? '').trim()
    const type = searchParams.get('type') ?? 'all'

    if (!q || q.length < 1) {
      return NextResponse.json({ users: [], posts: [] })
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          banned: false,
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
          verified: true,
          _count: { select: { followers: true } },
        },
        take: 10,
        orderBy: { followers: { _count: 'desc' } },
      })
      return NextResponse.json({ users })
    }

    if (type === 'posts') {
      const posts = await prisma.post.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          user: { banned: false },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              image: true,
              verified: true,
            },
          },
          reactions: { select: { id: true, type: true, userId: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      const normalized = posts.map(({ user, ...rest }) => ({ ...rest, author: user }))
      return NextResponse.json({ posts: normalized })
    }

    // type=all (default)
    const [users, rawPosts] = await Promise.all([
      prisma.user.findMany({
        where: {
          banned: false,
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
          verified: true,
          _count: { select: { followers: true } },
        },
        take: 10,
        orderBy: { followers: { _count: 'desc' } },
      }),
      prisma.post.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          user: { banned: false },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              image: true,
              verified: true,
            },
          },
          reactions: { select: { id: true, type: true, userId: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const posts = rawPosts.map(({ user, ...rest }) => ({ ...rest, author: user }))
    return NextResponse.json({ users, posts })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
