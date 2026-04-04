import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/users/[id]/block — toggle block
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: targetId } = await params
    const currentUserId = session.user.id

    if (currentUserId === targetId) {
      return NextResponse.json({ error: 'Impossible de se bloquer soi-même' }, { status: 400 })
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } },
    })

    let blocked: boolean

    if (existing) {
      // Unblock
      await prisma.block.delete({
        where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } },
      })
      blocked = false
    } else {
      // Block — remove follows in both directions first
      await prisma.$transaction([
        prisma.block.create({
          data: { blockerId: currentUserId, blockedId: targetId },
        }),
        prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: currentUserId, followingId: targetId },
              { followerId: targetId, followingId: currentUserId },
            ],
          },
        }),
      ])
      blocked = true
    }

    return NextResponse.json({ blocked })
  } catch (error) {
    console.error('[POST /api/users/[id]/block]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
