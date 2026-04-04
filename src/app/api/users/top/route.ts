import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/top — top 3 users by post count
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { banned: false },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        image: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: 'desc' } },
      take: 3,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[GET /api/users/top]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
