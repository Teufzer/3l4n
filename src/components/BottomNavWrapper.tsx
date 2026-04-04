import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import BottomNav from './BottomNav'

export default async function BottomNavWrapper() {
  const session = await auth()

  let profileHref = '/feed'
  let unreadCount = 0

  if (session?.user) {
    if (session.user.username) {
      profileHref = `/${session.user.username}`
    } else if (session.user.id) {
      profileHref = `/profile/${session.user.id}`
    }

    try {
      unreadCount = await prisma.notification.count({
        where: { userId: session.user.id, read: false },
      })
    } catch {
      // ignore if table doesn't exist yet (pre-migration)
    }
  }

  return <BottomNav profileHref={profileHref} unreadCount={unreadCount} />
}
