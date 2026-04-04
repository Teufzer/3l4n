import { prisma } from '@/lib/prisma'

type NotifType = 'MENTION' | 'REACTION' | 'COMMENT' | 'FOLLOW' | 'REPOST'

export async function upsertNotification({
  userId, actorId, type, postId, commentId,
}: {
  userId: string; actorId: string; type: NotifType; postId?: string | null; commentId?: string | null
}) {
  if (userId === actorId) return

  const existing = await prisma.notification.findFirst({
    where: { userId, actorId, type, postId: postId ?? null, read: false },
  })

  if (existing) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: { createdAt: new Date(), commentId: commentId ?? null },
    })
  } else {
    await prisma.notification.create({
      data: { userId, actorId, type, postId: postId ?? null, commentId: commentId ?? null },
    })
  }
}
