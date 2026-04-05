'use client'

import { useState, useEffect } from 'react'

type FollowStatus = 'none' | 'pending' | 'following'

interface FollowButtonProps {
  userId: string
  initialStatus?: FollowStatus
  /** @deprecated use initialStatus instead */
  initialFollowing?: boolean
  initialFollowersCount?: number
  onFollowChange?: (status: FollowStatus, followersCount: number) => void
}

export default function FollowButton({
  userId,
  initialStatus,
  initialFollowing = false,
  initialFollowersCount = 0,
  onFollowChange,
}: FollowButtonProps) {
  // `ready` stays false until the API has confirmed the real state
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<FollowStatus>(
    initialStatus ?? (initialFollowing ? 'following' : 'none')
  )
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [acting, setActing] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Fetch real follow status on mount — no optimistic pre-render
  useEffect(() => {
    let cancelled = false
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/users/${userId}/follow`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setStatus(data.status ?? (data.following ? 'following' : 'none'))
          setFollowersCount(data.followersCount)
        }
      } catch {
        // silent — keep initial props as fallback
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [userId])

  const handleClick = async () => {
    if (acting || !ready) return
    setActing(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      const newStatus: FollowStatus = data.status ?? (data.following ? 'following' : 'none')
      setStatus(newStatus)
      setFollowersCount(data.followersCount)
      onFollowChange?.(newStatus, data.followersCount)
    } catch {
      // silent
    } finally {
      setActing(false)
    }
  }

  // ── Skeleton while waiting for API ──────────────────────────
  if (!ready) {
    return (
      <button
        disabled
        className="w-36 h-8 rounded-full bg-zinc-800 animate-pulse cursor-not-allowed"
        aria-label="Chargement…"
      />
    )
  }

  // ── Pending → "Demande envoyée" (cliquable pour annuler) ─────
  if (status === 'pending') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={acting}
        aria-label={hovered ? 'Annuler la demande' : 'Demande envoyée'}
        className={[
          'w-36 h-8 rounded-full text-sm font-bold transition-none',
          acting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          hovered
            ? 'bg-red-500/10 text-red-400 border border-red-500'
            : 'bg-zinc-700 text-white/60 border border-zinc-600',
        ].join(' ')}
      >
        {acting ? '…' : hovered ? 'Annuler' : 'Demande envoyée'}
      </button>
    )
  }

  // ── Following → hover shows "Ne plus suivre" ─────────────────
  if (status === 'following') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={acting}
        aria-label={hovered ? 'Ne plus suivre' : 'Suivi'}
        className={[
          'w-36 h-8 rounded-full text-sm font-bold transition-none',
          acting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          hovered
            ? 'bg-red-500/10 text-red-400 border border-red-500'
            : 'bg-emerald-500 text-black',
        ].join(' ')}
      >
        {acting ? '…' : hovered ? 'Ne plus suivre' : 'Suivi ✓'}
      </button>
    )
  }

  // ── Not following ─────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      disabled={acting}
      aria-label="Suivre"
      className={[
        'w-36 h-8 rounded-full text-sm font-bold border border-emerald-500 text-emerald-400',
        'hover:bg-emerald-500/10 transition-none',
        acting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {acting ? '…' : 'Suivre'}
    </button>
  )
}
