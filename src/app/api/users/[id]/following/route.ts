import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id]/following — public list of users that [id] follows
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const follows = await prisma.follow.findMany({
      where: { followerId: id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const users = follows.map((f) => f.following)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[GET /api/users/[id]/following]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
