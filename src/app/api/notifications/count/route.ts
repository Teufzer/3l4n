import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/notifications/count — returns unread count + pending follow requests for polling
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0, followRequestsCount: 0 })
    }

    const [count, followRequestsCount] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
      prisma.follow.count({
        where: { followingId: session.user.id, status: 'PENDING' },
      }),
    ])

    return NextResponse.json({ count: count + followRequestsCount, followRequestsCount, notifCount: count })
  } catch (error) {
    console.error('[GET /api/notifications/count]', error)
    return NextResponse.json({ count: 0, followRequestsCount: 0 })
  }
}
