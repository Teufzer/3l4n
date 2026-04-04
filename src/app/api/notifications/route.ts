import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/notifications — list notifications for current user (unread first)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true, image: true },
        },
        post: {
          select: { id: true, content: true },
        },
      },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
