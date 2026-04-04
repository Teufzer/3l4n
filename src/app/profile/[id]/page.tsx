import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WeightChart, { WeightDataPoint } from '@/components/weight/WeightChart'
import ProfileEditModal from '@/components/profile/ProfileEditModal'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function computeWeightStats(entries: { weight: number; date: Date }[], startWeight?: number | null) {
  if (entries.length === 0) return null

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const first = startWeight ?? sorted[0].weight
  const last = sorted[sorted.length - 1].weight
  const diff = last - first

  return {
    start: first,
    current: last,
    diff: Math.abs(diff).toFixed(1),
    direction: diff < 0 ? 'perdu' : 'pris',
    isLoss: diff < 0,
  }
}

function computeStreak(entries: { date: Date }[]): number {
  if (entries.length === 0) return 0

  const dates = entries
    .map((e) => {
      const d = new Date(e.date)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    })
    .sort((a, b) => b - a)

  const unique = [...new Set(dates)]
  const DAY = 86400000
  const today = new Date()
  const todayTs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  let streak = 0
  let expected = todayTs

  if (unique[0] < expected - DAY) return 0

  for (const ts of unique) {
    if (ts === expected || ts === expected - DAY) {
      streak++
      expected = ts - DAY
    } else if (ts < expected) {
      break
    }
  }

  return streak
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      weightEntries: { orderBy: { date: 'asc' } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { reactions: true },
      },
      _count: { select: { posts: true, weightEntries: true } },
    },
  })

  if (!user) notFound()

  const stats = computeWeightStats(user.weightEntries, user.startWeight)
  const streak = computeStreak(user.weightEntries)
  const isOwnProfile = session?.user?.id === user.id

  const chartData: WeightDataPoint[] = user.weightEntries.map((e) => ({
    date: e.date.toISOString(),
    weight: e.weight,
    note: e.note ?? null,
  }))

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        {/* Profile header */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 mb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar || user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(user.avatar || user.image)!}
                  alt={user.name || 'Avatar'}
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-2xl">
                    {getInitials(user.name)}
                  </span>
                </div>
              )}
              {/* Streak badge */}
              {streak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-[#0f0f0f] border border-amber-500/40 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-xs">🔥</span>
                  <span className="text-xs font-bold text-amber-400">{streak}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {user.name || 'Utilisateur'}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Membre depuis{' '}
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {user.bio && (
                <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Edit button for own profile */}
          {isOwnProfile && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <ProfileEditModal
                userId={user.id}
                currentName={user.name ?? ''}
                currentBio={user.bio ?? ''}
              />
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Weight diff */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Poids</p>
            {stats ? (
              <>
                <p className="text-xl font-bold text-white">
                  {stats.diff}
                  <span className="text-xs font-normal text-zinc-400 ml-0.5">kg</span>
                </p>
                <p className="text-xs mt-1">
                  <span className={stats.isLoss ? 'text-emerald-400' : 'text-amber-400'}>
                    {stats.isLoss ? '▼' : '▲'} {stats.direction}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-zinc-600">—</p>
                <p className="text-xs text-zinc-600 mt-1">Aucune data</p>
              </>
            )}
          </div>

          {/* Posts count */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Posts</p>
            <p className="text-xl font-bold text-white">{user._count.posts}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {user._count.posts === 1 ? 'partage' : 'partages'}
            </p>
          </div>

          {/* Streak */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Streak</p>
            <p className="text-xl font-bold">
              {streak > 0 ? (
                <span className="text-amber-400">{streak}</span>
              ) : (
                <span className="text-zinc-600">0</span>
              )}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {streak > 0 ? `jour${streak > 1 ? 's' : ''} 🔥` : 'jour consécutif'}
            </p>
          </div>
        </div>

        {/* Weight chart */}
        {chartData.length > 0 && (
          <div className="mb-4">
            <WeightChart data={chartData} />
          </div>
        )}

        {chartData.length === 0 && isOwnProfile && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 mb-4 text-center">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-zinc-400 text-sm">Aucune donnée de poids pour l&apos;instant.</p>
            <Link
              href="/dashboard"
              className="inline-block mt-3 text-emerald-500 hover:text-emerald-400 text-sm font-medium transition"
            >
              Ajouter une pesée →
            </Link>
          </div>
        )}

        {/* Objectif de poids */}
        {user.targetWeight && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Objectif</p>
                <p className="text-xl font-bold text-emerald-400">{user.targetWeight} kg</p>
                {stats && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {(stats.current - user.targetWeight) > 0
                      ? `${(stats.current - user.targetWeight).toFixed(1)} kg à perdre`
                      : '🎯 Objectif atteint !'}
                  </p>
                )}
              </div>
              <span className="text-4xl">🎯</span>
            </div>
            {stats && user.startWeight && (
              <div className="mt-3">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round(
                        ((user.startWeight - stats.current) / (user.startWeight - user.targetWeight)) * 100
                      )))}%`
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1 text-right">
                  {Math.min(100, Math.max(0, Math.round(
                    ((user.startWeight - stats.current) / (user.startWeight - user.targetWeight)) * 100
                  )))}% accompli
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
