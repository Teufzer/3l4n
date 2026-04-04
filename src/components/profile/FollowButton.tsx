'use client'

import { useState, useEffect } from 'react'

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  initialFollowersCount?: number
  onFollowChange?: (following: boolean, followersCount: number) => void
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  initialFollowersCount = 0,
  onFollowChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Fetch real status on mount
  useEffect(() => {
    let cancelled = false
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/users/${userId}/follow`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setFollowing(data.following)
          setFollowersCount(data.followersCount)
          setHydrated(true)
        }
      } catch {
        // silent — use initial props
        if (!cancelled) setHydrated(true)
      }
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [userId])

  const handleClick = async () => {
    if (loading) return

    // Optimistic update
    const newFollowing = !following
    const newCount = newFollowing ? followersCount + 1 : Math.max(0, followersCount - 1)
    setFollowing(newFollowing)
    setFollowersCount(newCount)
    setLoading(true)

    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
      if (!res.ok) {
        // Revert on error
        setFollowing(following)
        setFollowersCount(followersCount)
        return
      }
      const data = await res.json()
      setFollowing(data.following)
      setFollowersCount(data.followersCount)
      onFollowChange?.(data.following, data.followersCount)
    } catch {
      // Revert on error
      setFollowing(following)
      setFollowersCount(followersCount)
    } finally {
      setLoading(false)
    }
  }

  // Determine label
  let label: string
  if (loading) {
    label = following ? 'Suivi' : 'Suivre'
  } else if (following) {
    label = hovered ? 'Ne plus suivre' : 'Suivi'
  } else {
    label = 'Suivre'
  }

  const isFollowingStyle = following && !loading
  const isDanger = following && hovered && !loading

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading || !hydrated}
      aria-label={label}
      className={[
        'relative flex items-center justify-center gap-2 px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-150',
        'min-w-[96px]',
        isFollowingStyle
          ? isDanger
            ? 'bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10'
            : 'bg-white text-black hover:bg-zinc-200'
          : 'bg-transparent border border-white text-white hover:bg-white/10',
        (loading || !hydrated) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {loading && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        </span>
      )}
      <span className={loading ? 'ml-4' : ''}>{label}</span>
    </button>
  )
}
