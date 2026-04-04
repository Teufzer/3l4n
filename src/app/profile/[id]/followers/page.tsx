import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FollowUserCard from '@/components/profile/FollowUserCard'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FollowersPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true },
  })

  if (!user) notFound()

  const follows = await prisma.follow.findMany({
    where: { followingId: id },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          avatar: true,
          verified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const followers = follows.map((f) => f.follower)
  const displayName = user.username ? `@${user.username}` : user.name || 'cet utilisateur'
  const backUrl = user.username ? `/@${user.username}` : `/profile/${id}`

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-zinc-800/60 px-4 py-3 flex items-center gap-4">
        <Link
          href={backUrl}
          className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors text-white"
          aria-label="Retour"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">
            Abonnés de {displayName}
          </p>
          <p className="text-zinc-500 text-xs">
            {followers.length} abonné{followers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* List */}
      <div className="divide-y divide-zinc-800/60">
        {followers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-zinc-500 text-sm">Aucun abonné pour l&apos;instant.</p>
          </div>
        ) : (
          followers.map((follower) => (
            <FollowUserCard
              key={follower.id}
              user={follower}
              currentUserId={session?.user?.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
