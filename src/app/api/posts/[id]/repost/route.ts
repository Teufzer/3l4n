import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/posts/[id]/repost — toggle repost
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: postId } = await params
    const userId = session.user.id

    // Email verification required
    if (!(session.user as { emailVerified?: unknown }).emailVerified && (session.user as { isCredentialsUser?: boolean }).isCredentialsUser) {
      return NextResponse.json({ error: 'Verifie ton email avant d`effectuer cette action.' }, { status: 403 })
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    // No auto-repost
    if (post.userId === userId) {
      return NextResponse.json({ error: 'Tu ne peux pas repost ton propre post' }, { status: 403 })
    }

    const existing = await prisma.repost.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    let reposted: boolean

    if (existing) {
      await prisma.repost.delete({ where: { id: existing.id } })
      reposted = false
    } else {
      await prisma.repost.create({ data: { userId, postId } })
      reposted = true

      // Notification pour l'auteur du post original
      if (post.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'REPOST',
            userId: post.userId,
            actorId: userId,
            postId,
          },
        })
      }
    }

    const count = await prisma.repost.count({ where: { postId } })

    return NextResponse.json({ reposted, count })
  } catch (error) {
    console.error('[POST /api/posts/[id]/repost]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
