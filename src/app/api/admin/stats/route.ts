import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const [userCount, postCount, unresolvedReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({ where: { resolved: false } }),
    ])

    return NextResponse.json({ userCount, postCount, unresolvedReports })
  } catch (error) {
    console.error('[GET /api/admin/stats]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
