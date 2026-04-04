import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id]/followers — public list of users who follow [id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const follows = await prisma.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
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

    const users = follows.map((f) => f.follower)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[GET /api/users/[id]/followers]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
