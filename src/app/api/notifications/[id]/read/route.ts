import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/notifications/[id]/read — mark a single notification as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Only update if it belongs to the current user
    const updated = await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/notifications/[id]/read]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
