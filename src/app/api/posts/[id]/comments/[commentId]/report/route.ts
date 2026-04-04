import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/posts/[id]/comments/[commentId]/report
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { commentId } = await params
    const body = await req.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'La raison est requise' }, { status: 400 })
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
    }

    // Prevent duplicate reports from same user
    const existing = await prisma.report.findFirst({
      where: { reporterId: session.user.id, commentId, resolved: false },
    })
    if (existing) {
      return NextResponse.json({ error: 'Tu as déjà signalé ce commentaire' }, { status: 409 })
    }

    const report = await prisma.report.create({
      data: {
        reason: reason.trim(),
        reporterId: session.user.id,
        commentId,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts/[id]/comments/[commentId]/report]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
