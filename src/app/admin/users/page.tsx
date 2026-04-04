import { prisma } from '@/lib/prisma'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const rawUsers = await prisma.user.findMany({
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

  const userIds = rawUsers.map((u) => u.id)
  const weeklyEntries = await prisma.weightEntry.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'asc' },
    select: { userId: true, weight: true },
  })

  const weeklyMap = new Map<string, { oldest: number; newest: number }>()
  for (const entry of weeklyEntries) {
    const existing = weeklyMap.get(entry.userId)
    if (!existing) {
      weeklyMap.set(entry.userId, { oldest: entry.weight, newest: entry.weight })
    } else {
      existing.newest = entry.weight
    }
  }

  const users = rawUsers.map((user) => {
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
      _count: {
        posts: user._count.posts,
        comments: user._count.comments,
      },
      weightDelta,
      weightEntriesCount: user._count.weightEntries,
      weeklyWeightChange,
    }
  })

  return <AdminUsersClient initialUsers={users} />
}
