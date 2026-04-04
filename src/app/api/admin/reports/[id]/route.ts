import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/admin/reports/[id]
// body: { action: 'ignore' | 'delete' | 'ban' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body as { action: 'ignore' | 'delete' | 'ban' }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        post: { select: { id: true, userId: true } },
        comment: { select: { id: true, userId: true } },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Signalement introuvable' }, { status: 404 })
    }

    if (action === 'ignore') {
      await prisma.report.update({ where: { id }, data: { resolved: true } })
    } else if (action === 'delete') {
      // Delete the content and resolve the report
      if (report.postId && report.post) {
        await prisma.post.delete({ where: { id: report.postId } })
        // Report is cascade-deleted with the post, so nothing else needed
      } else if (report.commentId && report.comment) {
        await prisma.comment.delete({ where: { id: report.commentId } })
        // Same for comment
      }
      // Mark any remaining reports as resolved (if not cascade-deleted)
      await prisma.report.updateMany({
        where: { id },
        data: { resolved: true },
      })
    } else if (action === 'ban') {
      // Ban the author of the reported content and resolve report
      const authorId = report.post?.userId ?? report.comment?.userId
      if (authorId) {
        await prisma.user.update({ where: { id: authorId }, data: { banned: true } })
      }
      await prisma.report.update({ where: { id }, data: { resolved: true } })
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/admin/reports/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
