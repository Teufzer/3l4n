import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upsertNotification } from '@/lib/notifications'
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
      prisma.follow.count({ where: { followingId: targetId, status: 'ACCEPTED' } }),
      prisma.follow.count({ where: { followerId: targetId, status: 'ACCEPTED' } }),
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

    // Determine status
    let status: 'pending' | 'following' | 'none' = 'none'
    if (followRecord) {
      status = followRecord.status === 'ACCEPTED' ? 'following' : 'pending'
    }

    return NextResponse.json({
      // Legacy field for backwards compat
      following: status === 'following',
      status,
      blocked: !!blockRecord,
      followersCount,
      followingCount,
    })
  } catch (error) {
    console.error('[GET /api/users/[id]/follow]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/users/[id]/follow — toggle follow (with pending support for private profiles)
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

    // Check if already following (any status)
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
    })

    let resultStatus: 'pending' | 'following' | 'none'

    if (existing) {
      // Unfollow or cancel pending request
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
      })
      resultStatus = 'none'
    } else {
      // Check block
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

      // Fetch target user to check if private
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        select: { profilePrivate: true },
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }

      const followStatus = targetUser.profilePrivate ? 'PENDING' : 'ACCEPTED'

      await prisma.follow.create({
        data: { followerId: currentUserId, followingId: targetId, status: followStatus },
      })

      resultStatus = followStatus === 'PENDING' ? 'pending' : 'following'

      // Create FOLLOW notification
      // Different message text is handled on the frontend/notification display level via status
      await upsertNotification({ userId: targetId, actorId: currentUserId, type: 'FOLLOW' })
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: targetId, status: 'ACCEPTED' },
    })

    return NextResponse.json({
      status: resultStatus,
      // Legacy field for backwards compat
      following: resultStatus === 'following',
      followersCount,
    })
  } catch (error) {
    console.error('[POST /api/users/[id]/follow]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
