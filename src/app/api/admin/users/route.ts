import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        image: true,
        role: true,
        banned: true,
        verified: true,
        createdAt: true,
        startWeight: true,
        _count: {
          select: { posts: true, comments: true, weightEntries: true },
        },
        weightEntries: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { weight: true, date: true },
        },
      },
    })

    // Fetch weekly weight data for each user in one query
    const userIds = users.map((u) => u.id)
    const weeklyEntries = await prisma.weightEntry.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
      select: { userId: true, weight: true, date: true },
    })

    // Build a map: userId -> [oldest in 7d, newest in 7d]
    const weeklyMap = new Map<string, { oldest: number; newest: number }>()
    for (const entry of weeklyEntries) {
      const existing = weeklyMap.get(entry.userId)
      if (!existing) {
        weeklyMap.set(entry.userId, { oldest: entry.weight, newest: entry.weight })
      } else {
        existing.newest = entry.weight
      }
    }

    const enrichedUsers = users.map((user) => {
      const lastEntry = user.weightEntries[0] ?? null
      const weightDelta =
        lastEntry && user.startWeight != null
          ? lastEntry.weight - user.startWeight
          : null

      const weeklyData = weeklyMap.get(user.id)
      const weeklyWeightChange =
        weeklyData ? weeklyData.newest - weeklyData.oldest : null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        image: user.image,
        role: user.role,
        banned: user.banned,
        verified: user.verified,
        createdAt: user.createdAt,
        startWeight: user.startWeight,
        _count: user._count,
        weightDelta,
        weightEntriesCount: user._count.weightEntries,
        weeklyWeightChange,
      }
    })

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    console.error('[GET /api/admin/users]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
