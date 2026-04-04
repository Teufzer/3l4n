'use client'

import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import FollowButton from '@/components/profile/FollowButton'

interface FollowUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  avatar: string | null
  verified?: boolean
}

interface FollowUserCardProps {
  user: FollowUser
  currentUserId?: string | null
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

export default function FollowUserCard({ user, currentUserId }: FollowUserCardProps) {
  const isOwnProfile = currentUserId === user.id
  const profileUrl = user.username ? `/@${user.username}` : `/profile/${user.id}`

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 hover:bg-zinc-900/50 transition-colors">
      <Link href={profileUrl} className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        {user.avatar || user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(user.avatar || user.image)!}
            alt={user.name || 'Avatar'}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 font-bold text-sm">
              {getInitials(user.name)}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate flex items-center gap-1">
            {user.name || 'Utilisateur'}
            {user.verified && <VerifiedBadge className="w-4 h-4 inline-block flex-shrink-0" />}
          </p>
          {user.username && (
            <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
          )}
        </div>
      </Link>

      {/* Follow button — hidden for own profile */}
      {!isOwnProfile && (
        <FollowButton userId={user.id} />
      )}
    </div>
  )
}
