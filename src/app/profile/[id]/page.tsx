import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface ProfilePageProps {
  params: { id: string }
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

function computeWeightStats(entries: { weight: number; date: Date }[]) {
  if (entries.length < 2) return null

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const first = sorted[0].weight
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

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth()
  const { id } = await Promise.resolve(params)

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      weightEntries: {
        orderBy: { date: 'asc' },
      },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reactions: true,
        },
      },
      _count: {
        select: {
          posts: true,
          weightEntries: true,
        },
      },
    },
  })

  if (!user) notFound()

  const stats = computeWeightStats(user.weightEntries)
  const isOwnProfile = session?.user?.id === user.id

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
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
                <Image
                  src={(user.avatar || user.image)!}
                  alt={user.name || 'Avatar'}
                  width={72}
                  height={72}
                  className="rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-2xl">
                    {getInitials(user.name)}
                  </span>
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

          {isOwnProfile && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <Link
                href="/settings"
                className="text-sm text-emerald-500 hover:text-emerald-400 transition font-medium"
              >
                Modifier le profil →
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Weight stat */}
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Poids</p>
            {stats ? (
              <>
                <p className="text-2xl font-bold text-white">
                  {stats.diff}
                  <span className="text-base font-normal text-zinc-400 ml-1">kg</span>
                </p>
                <p className="text-sm mt-1">
                  <span className={stats.isLoss ? 'text-emerald-400' : 'text-amber-400'}>
                    {stats.isLoss ? '▼' : '▲'} {stats.direction}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-zinc-600">—</p>
                <p className="text-xs text-zinc-600 mt-1">Pas encore de données</p>
              </>
            )}
          </div>

          {/* Posts stat */}
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Posts</p>
            <p className="text-2xl font-bold text-white">
              {user._count.posts}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {user._count.posts === 1 ? 'partage' : 'partages'}
            </p>
          </div>
        </div>

        {/* Weight entries count */}
        {user._count.weightEntries > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Entrées de poids</p>
                <p className="text-white">
                  <span className="text-2xl font-bold">{user._count.weightEntries}</span>
                  <span className="text-zinc-400 ml-2 text-sm">mesures enregistrées</span>
                </p>
              </div>
              {stats && (
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Actuel</p>
                  <p className="text-emerald-400 font-bold text-lg">{stats.current} kg</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent posts */}
        {user.posts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Derniers partages
            </h2>
            {user.posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800"
              >
                <p className="text-white text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-zinc-600">
                    {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {post.reactions.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {post.reactions.length} réaction{post.reactions.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {user.posts.length === 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">Aucun partage pour l&apos;instant.</p>
            {isOwnProfile && (
              <Link
                href="/feed"
                className="inline-block mt-3 text-emerald-500 hover:text-emerald-400 text-sm font-medium transition"
              >
                Partager quelque chose →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
