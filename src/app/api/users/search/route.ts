import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/users/search?q=xxx — returns first 5 users whose username starts with q
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''

    if (!q || q.length < 1) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        username: { startsWith: q, mode: 'insensitive' },
        banned: false,
      },
      select: { id: true, username: true, name: true, avatar: true, image: true },
      take: 5,
      orderBy: { username: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[GET /api/users/search]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
