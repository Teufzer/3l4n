import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/users/follow-requests/[followId]/reject — only the recipient can reject
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ followId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { followId } = await params
    const userId = session.user.id

    // Find the follow request
    const followRequest = await prisma.follow.findUnique({
      where: { id: followId },
    })

    if (!followRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

    // Only the recipient (followingId) can reject
    if (followRequest.followingId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (followRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cette demande n\'est pas en attente' }, { status: 400 })
    }

    await prisma.follow.delete({
      where: { id: followId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/users/follow-requests/[followId]/reject]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
