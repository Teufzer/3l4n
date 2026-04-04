import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 300

export async function GET() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Total members & posts
  const [members, posts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
  ])

  // kgLost / kgGained : pour chaque user avec startWeight, prendre la dernière WeightEntry
  const usersWithStart = await prisma.user.findMany({
    where: {
      startWeight: { not: null },
      weightEntries: { some: {} },
    },
    select: {
      id: true,
      startWeight: true,
      weightEntries: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { weight: true },
      },
    },
  })

  let kgLost = 0
  let kgGained = 0

  for (const user of usersWithStart) {
    if (!user.startWeight || user.weightEntries.length === 0) continue
    const lastWeight = user.weightEntries[0].weight
    const delta = lastWeight - user.startWeight
    if (delta < 0) {
      kgLost += Math.abs(delta)
    } else if (delta > 0) {
      kgGained += delta
    }
  }

  // weeklyTop : WeightEntry des 7 derniers jours, variation entre première et dernière par user
  const weeklyEntries = await prisma.weightEntry.findMany({
    where: {
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'asc' },
    select: {
      userId: true,
      weight: true,
      date: true,
      user: {
        select: {
          username: true,
          name: true,
        },
      },
    },
  })

  // Group by userId
  const byUser = new Map<
    string,
    { username: string | null; name: string | null; entries: { weight: number; date: Date }[] }
  >()

  for (const entry of weeklyEntries) {
    if (!byUser.has(entry.userId)) {
      byUser.set(entry.userId, {
        username: entry.user.username,
        name: entry.user.name,
        entries: [],
      })
    }
    byUser.get(entry.userId)!.entries.push({ weight: entry.weight, date: entry.date })
  }

  const weeklyTop = Array.from(byUser.entries())
    .filter(([, data]) => data.entries.length >= 2)
    .map(([userId, data]) => {
      const sorted = data.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const first = sorted[0].weight
      const last = sorted[sorted.length - 1].weight
      const delta = last - first
      return {
        userId,
        username: data.username,
        name: data.name ?? data.username ?? 'Utilisateur',
        delta,
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)

  return NextResponse.json({
    members,
    posts,
    kgLost: Math.round(kgLost * 10) / 10,
    kgGained: Math.round(kgGained * 10) / 10,
    weeklyTop,
  })
}
