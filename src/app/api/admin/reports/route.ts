import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, avatar: true, image: true },
        },
        post: {
          select: {
            id: true,
            content: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('[GET /api/admin/reports]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
