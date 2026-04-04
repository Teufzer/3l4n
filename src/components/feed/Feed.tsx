'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import PostCard, { Post } from './PostCard'
import PostForm from './PostForm'

const PAGE_SIZE = 10

interface FeedProps {
  r2Enabled?: boolean
}

export default function Feed({ r2Enabled = false }: FeedProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/posts?page=${pageNum}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error('Impossible de charger le feed')
      const data = await res.json()
      const fetched: Post[] = data.posts ?? []

      setPosts((prev) => (replace ? fetched : [...prev, ...fetched]))
      setHasMore(fetched.length === PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(1, true)
  }, [fetchPosts])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPosts(next)
  }

  const handlePostCreated = () => {
    setPage(1)
    fetchPosts(1, true)
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-6 space-y-4 pb-24">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-white text-2xl font-bold tracking-tight">Communauté</h1>
        <p className="text-white/40 text-sm">Partagez, encouragez, progressez ensemble</p>
      </div>

      {/* Post form — only if logged in */}
      {currentUserId ? (
        <PostForm onPostCreated={handlePostCreated} userName={session?.user?.name ?? 'Moi'} r2Enabled={r2Enabled} />
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 text-center text-white/40 text-sm">
          <a href="/login" className="text-emerald-400 hover:underline">Connecte-toi</a> pour partager ta progression ✨
        </div>
      )}

      {/* Feed */}
      {initialLoad ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-4/5 bg-white/10 rounded" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-7 w-16 bg-white/5 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => fetchPosts(1, true)}
            className="text-emerald-400 text-sm underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <span className="text-3xl">🌱</span>
          </div>
          <div className="space-y-1.5">
            <p className="text-white font-semibold">Sois le premier à partager ta progression !</p>
            <p className="text-white/40 text-sm max-w-xs mx-auto">
              La communauté attend tes premiers pas. Partage tes ressentis, tes victoires, ton parcours.
            </p>
          </div>
          {currentUserId && (
            <p className="text-emerald-400 text-sm animate-bounce">↑ Écris quelque chose ci-dessus</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm
                  hover:border-emerald-500/40 hover:text-emerald-400 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement…' : 'Voir plus'}
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-white/20 text-xs py-4">
              Vous avez tout vu 🎉
            </p>
          )}
        </>
      )}
    </div>
  )
}
