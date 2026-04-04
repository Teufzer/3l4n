import { prisma } from '@/lib/prisma'

type NotifType = 'MENTION' | 'REACTION' | 'COMMENT' | 'FOLLOW' | 'REPOST'

/**
 * Crée ou met à jour une notification en évitant le spam.
 * Si une notif du même (userId, actorId, type, postId) existe déjà et n'est pas lue,
 * on la reset (date + read=false) au lieu d'en créer une nouvelle.
 */
export async function upsertNotification({
  userId,
  actorId,
  type,
  postId,
  commentId,
}: {
  userId: string
  actorId: string
  type: NotifType
  postId?: string | null
  commentId?: string | null
}) {
  // Ne pas notifier soi-même
  if (userId === actorId) return

  // Chercher une notif existante non lue du même type, acteur, et post
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      actorId,
      type,
      postId: postId ?? null,
      read: false, // seulement si pas encore lue
    },
  })

  if (existing) {
    // Mettre à jour la date pour la remonter en haut
    await prisma.notification.update({
      where: { id: existing.id },
      data: { createdAt: new Date(), commentId: commentId ?? null },
    })
  } else {
    // Créer une nouvelle notif
    await prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        postId: postId ?? null,
        commentId: commentId ?? null,
      },
    })
  }
}
