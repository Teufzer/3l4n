import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/users/follow-requests — list pending follow requests for the authenticated user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id

    const requests = await prisma.follow.findMany({
      where: {
        followingId: userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            image: true,
            verified: true,
          },
        },
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[GET /api/users/follow-requests]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
