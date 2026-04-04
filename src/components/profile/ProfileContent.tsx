'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import { Session } from 'next-auth'
import WeightChart, { WeightDataPoint } from '@/components/weight/WeightChart'
import WeightStats from '@/components/weight/WeightStats'
import FollowButton from '@/components/profile/FollowButton'

import PostCard, { Post } from '@/components/feed/PostCard'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  avatar: string | null
  bannerUrl?: string | null
  bio: string | null
  createdAt: Date
  startWeight: number | null
  targetWeight: number | null
  height?: number | null
  weightPrivate?: boolean
  weightEntries: { id: string; weight: number; date: Date; note: string | null }[]
  posts: { id: string; content: string; createdAt: Date; reactions: { type: string }[] }[]
  _count: { posts: number; weightEntries: number; followers?: number; following?: number }
}

type Tab = 'posts' | 'courbe' | 'medias'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function computeWeightStats(
  entries: { weight: number; date: Date }[],
  startWeight?: number | null
) {
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
    direction: diff < 0 ? 'perdus' : 'pris',
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

function formatMemberSince(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileContent({
  user,
  session,
}: {
  user: ProfileUser
  session: Session | null
}) {
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsFetched, setPostsFetched] = useState(false)

  const [followersCount, setFollowersCount] = useState(user._count.followers ?? 0)
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)

  const isOwnProfile = session?.user?.id === user.id
  const isWeightPrivate = !!user.weightPrivate && !isOwnProfile
  const stats = computeWeightStats(user.weightEntries, user.startWeight)
  const streak = computeStreak(user.weightEntries)

  // IMC
  const sortedEntries = [...user.weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const lastWeight = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].weight : null
  const showImc = !isWeightPrivate && lastWeight !== null && user.height != null && user.height > 0
  const imcValue = showImc ? lastWeight! / Math.pow(user.height! / 100, 2) : null
  const imcLabel = imcValue !== null
    ? imcValue < 18.5 ? 'Insuffisance pondérale'
    : imcValue < 25 ? 'Corpulence normale'
    : imcValue < 30 ? 'Surpoids'
    : 'Obésité'
    : null
  const imcColor = imcValue !== null
    ? imcValue < 18.5 ? 'text-amber-400'
    : imcValue < 25 ? 'text-emerald-400'
    : imcValue < 30 ? 'text-amber-400'
    : 'text-red-400'
    : null

  const handleBlock = async () => {
    setBlocking(true)
    setBlockMenuOpen(false)
    try {
      await fetch(`/api/users/${user.id}/block`, { method: 'POST' })
    } catch {
      // silent
    } finally {
      setBlocking(false)
    }
  }

  const chartData: WeightDataPoint[] = user.weightEntries.map((e) => ({
    date: new Date(e.date).toISOString(),
    weight: e.weight,
    note: e.note ?? null,
  }))

  // Fetch posts on first load (or when switching to Posts tab)
  const fetchPosts = useCallback(async () => {
    if (postsLoading) return
    setPostsLoading(true)
    try {
      const res = await fetch(`/api/posts?userId=${user.id}&limit=50`)
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      // silent
    } finally {
      setPostsLoading(false)
      setPostsFetched(true)
    }
  }, [user.id, postsLoading])

  useEffect(() => {
    if (!postsFetched) {
      fetchPosts()
    }
  }, [postsFetched, fetchPosts])

  const mediaPosts = posts.filter((p) => p.imageUrl)

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostUpdated = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-zinc-800/60 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => { window.location.href = '/feed' }}
          className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors text-white"
          aria-label="Retour"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">
            {user.name || 'Utilisateur'}
          </p>
          <p className="text-zinc-500 text-xs">
            {user._count.posts} post{user._count.posts !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* ── Banner + avatar ────────────────────────────────────── */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 relative">
          {user.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.bannerUrl}
              alt="Bannière"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-900" />
          )}
        </div>

        {/* Avatar — overlaps banner */}
        <div className="px-4">
          <div className="flex items-end justify-between -mt-6 relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar || user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(user.avatar || user.image)!}
                  alt={user.name || 'Avatar'}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#0f0f0f]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-zinc-700 ring-4 ring-[#0f0f0f] flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-2xl">
                    {getInitials(user.name)}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mb-2 flex items-center gap-2">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="px-4 py-1.5 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition"
                >
                  Modifier le profil
                </Link>
              ) : (
                <>
                  <FollowButton
                    userId={user.id}
                    initialFollowersCount={followersCount}
                    onFollowChange={(_, count) => setFollowersCount(count)}
                  />
                  {/* Block menu */}
                  <div className="relative">
                    <button
                      onClick={() => setBlockMenuOpen((v) => !v)}
                      className="p-2 rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
                      aria-label="Plus d'options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                    {blockMenuOpen && (
                      <div className="absolute right-0 top-10 z-50 bg-[#1a1a1a] border border-zinc-700 rounded-xl shadow-xl min-w-[160px] overflow-hidden">
                        <button
                          onClick={handleBlock}
                          disabled={blocking}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition flex items-center gap-2"
                        >
                          {blocking ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="9" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          )}
                          Bloquer
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="mt-3 space-y-1">
            <h1 className="text-white font-bold text-xl leading-tight flex items-center gap-2">
              {user.name || 'Utilisateur'}
              {(user as {verified?: boolean}).verified && <VerifiedBadge className="w-5 h-5" />}
            </h1>
            {user.username && (
              <p className="text-zinc-500 text-sm">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-zinc-300 text-sm leading-relaxed pt-1">{user.bio}</p>
            )}
            <p className="text-zinc-500 text-sm flex items-center gap-1.5 pt-1">
              <svg className="w-4 h-4 inline-block flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Membre depuis {formatMemberSince(user.createdAt)}
            </p>

            {/* Follow counts */}
            <div className="flex items-center gap-4 pt-2 text-sm">
              <Link href={user.username ? `/${user.username}/followers` : `/profile/${user.id}/followers`} className="hover:underline">
                <span className="text-white font-bold">{followersCount}</span>
                <span className="text-zinc-500 ml-1">abonné{followersCount !== 1 ? 's' : ''}</span>
              </Link>
              <Link href={user.username ? `/${user.username}/following` : `/profile/${user.id}/following`} className="hover:underline">
                <span className="text-white font-bold">{user._count.following ?? 0}</span>
                <span className="text-zinc-500 ml-1">abonnements</span>
              </Link>
            </div>

            {/* Inline stats */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
              <span>
                <span className="text-white font-bold">{user._count.posts}</span>
                <span className="text-zinc-500 ml-1">Posts</span>
              </span>
              {stats && (
                <span>
                  <span className={`font-bold ${stats.isLoss ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {stats.diff} kg
                  </span>
                  <span className="text-zinc-500 ml-1">{stats.direction}</span>
                </span>
              )}
              {streak > 0 && (
                <span>
                  <span className="text-amber-400 font-bold">{streak}</span>
                  <span className="text-zinc-500 ml-1">
                    jour{streak > 1 ? 's' : ''} streak 🔥
                  </span>
                </span>
              )}
              {imcValue !== null && imcLabel !== null && (
                <span title={imcLabel}>
                  <span className={`font-bold text-xs ${imcColor}`}>IMC {imcValue.toFixed(1)}</span>
                  <span className="text-zinc-500 ml-1 text-xs">{imcLabel}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="mt-4 border-b border-zinc-800 sticky top-[57px] z-20 bg-[#0f0f0f]">
        <div className="flex">
          {(
            [
              { id: 'posts', label: 'Posts' },
              { id: 'courbe', label: 'Courbe' },
              { id: 'medias', label: 'Médias' },
            ] as { id: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {tab.id === 'courbe' && isWeightPrivate ? '🔒 Privée' : tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-zinc-500 text-sm">Aucun post pour l&apos;instant.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={`${post.isRepost ? 'repost' : 'post'}-${post.id}-${post.repostedAt ?? post.createdAt}`}>
                  {post.isRepost && (
                    <div className="flex items-center gap-1.5 px-1 pb-1.5 text-xs text-zinc-500">
                      <span>🔄</span>
                      <span>A reposté</span>
                    </div>
                  )}
                  <PostCard
                    post={post}
                    currentUserId={session?.user?.id}
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Courbe tab */}
        {activeTab === 'courbe' && (
          <div className="space-y-4">
            {isWeightPrivate ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🔒</p>
                <p className="text-white font-semibold text-sm mb-1">Données privées</p>
                <p className="text-zinc-500 text-sm">Cet utilisateur a rendu sa courbe de poids privée.</p>
              </div>
            ) : chartData.length > 0 ? (
              <>
                <WeightChart
                  data={chartData}
                  goal={user.targetWeight ?? undefined}
                />
                <WeightStats
                  data={chartData}
                  goal={user.targetWeight ?? undefined}
                  startWeight={user.startWeight ?? undefined}
                  targetWeight={user.targetWeight ?? undefined}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-zinc-500 text-sm">Aucune donnée de poids pour l&apos;instant.</p>
              </div>
            )}
          </div>
        )}

        {/* Médias tab */}
        {activeTab === 'medias' && (
          <div>
            {postsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mediaPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🖼️</p>
                <p className="text-zinc-500 text-sm">Aucun média partagé pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {mediaPosts.map((post) => (
                  <a
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="aspect-square overflow-hidden rounded-lg block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl!}
                      alt="Media"
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
