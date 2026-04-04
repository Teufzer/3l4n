import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/users/[id]/follow — public status + counts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params
    const session = await auth()
    const currentUserId = session?.user?.id ?? null

    const [followersCount, followingCount, followRecord, blockRecord] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetId } }),
      prisma.follow.count({ where: { followerId: targetId } }),
      currentUserId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
          })
        : null,
      currentUserId
        ? prisma.block.findFirst({
            where: {
              OR: [
                { blockerId: currentUserId, blockedId: targetId },
                { blockerId: targetId, blockedId: currentUserId },
              ],
            },
          })
        : null,
    ])

    return NextResponse.json({
      following: !!followRecord,
      blocked: !!blockRecord,
      followersCount,
      followingCount,
    })
  } catch (error) {
    console.error('[GET /api/users/[id]/follow]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/users/[id]/follow — toggle follow
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if ((session.user as { banned?: boolean }).banned) {
      return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 })
    }

    const { id: targetId } = await params
    const currentUserId = session.user.id

    if (currentUserId === targetId) {
      return NextResponse.json({ error: 'Impossible de se suivre soi-même' }, { status: 400 })
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
    })

    let following: boolean

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
      })
      following = false
    } else {
      // Follow — check that neither party has blocked the other
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: targetId },
            { blockerId: targetId, blockedId: currentUserId },
          ],
        },
      })
      if (block) {
        return NextResponse.json({ error: 'Action impossible (blocage actif)' }, { status: 403 })
      }

      await prisma.follow.create({
        data: { followerId: currentUserId, followingId: targetId },
      })
      following = true

      // Create FOLLOW notification
      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          userId: targetId,
          actorId: currentUserId,
        },
      })
    }

    const followersCount = await prisma.follow.count({ where: { followingId: targetId } })

    return NextResponse.json({ following, followersCount })
  } catch (error) {
    console.error('[POST /api/users/[id]/follow]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
