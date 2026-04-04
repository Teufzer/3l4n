import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/posts/[id]/report
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

    const { id: postId } = await params
    const body = await req.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'La raison est requise' }, { status: 400 })
    }

    if (reason.trim().length > 500) {
      return NextResponse.json({ error: 'La raison ne doit pas dépasser 500 caractères' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    // Prevent duplicate reports from same user
    const existing = await prisma.report.findFirst({
      where: { reporterId: session.user.id, postId, resolved: false },
    })
    if (existing) {
      return NextResponse.json({ error: 'Tu as déjà signalé ce post' }, { status: 409 })
    }

    const report = await prisma.report.create({
      data: {
        reason: reason.trim(),
        reporterId: session.user.id,
        postId,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts/[id]/report]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
