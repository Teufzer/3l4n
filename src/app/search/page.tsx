'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import PostCard, { Post } from '@/components/feed/PostCard'
import { useSession } from 'next-auth/react'

interface SearchUser {
  id: string
  username: string | null
  name: string | null
  avatar: string | null
  image: string | null
  verified: boolean
  _count: { followers: number }
}

type Tab = 'people' | 'posts'

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  )
}

function UserResultCard({ user, currentUserId }: { user: SearchUser; currentUserId?: string }) {
  const [following, setFollowing] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const href = user.username ? `/${user.username}` : `/profile/${user.id}`

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentUserId || loadingFollow) return
    setLoadingFollow(true)
    try {
      await fetch(`/api/users/${user.id}/follow`, { method: 'POST' })
      setFollowing((v) => !v)
    } catch {
      // noop
    } finally {
      setLoadingFollow(false)
    }
  }

  const avatarSrc = user.avatar || user.image

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition rounded-2xl group">
      <Link href={href} className="flex-shrink-0">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={user.name ?? 'avatar'} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-emerald-500/40 transition" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base ring-2 ring-white/10 group-hover:ring-emerald-500/40 transition">
            {(user.name || user.username || 'U')[0].toUpperCase()}
          </div>
        )}
      </Link>
      <Link href={href} className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-white font-semibold text-sm truncate">{user.name || user.username}</p>
          {user.verified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
          {user.username && <p className="text-white/40 text-xs">@{user.username}</p>}
          <p className="text-white/30 text-xs">{user._count.followers} abonné{user._count.followers !== 1 ? 's' : ''}</p>
        </div>
      </Link>
      {currentUserId && currentUserId !== user.id && (
        <button
          onClick={handleFollow}
          disabled={loadingFollow}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50
            ${following
              ? 'bg-white/10 text-white/70 hover:bg-white/15'
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
            }`}
        >
          {following ? 'Abonné' : 'Suivre'}
        </button>
      )}
    </div>
  )
}

function EmptyState({ query, tab }: { query: string; tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <SearchIcon className="w-7 h-7 text-white/30" />
      </div>
      <p className="text-white/60 font-semibold text-base mb-1">
        Aucun résultat pour &ldquo;{query}&rdquo;
      </p>
      <p className="text-white/30 text-sm">
        Essaie avec {tab === 'people' ? 'un autre nom ou @username' : 'des mots différents'}
      </p>
    </div>
  )
}

function SuggestionsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse px-4 py-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/5 rounded w-32" />
            <div className="h-2 bg-white/5 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const currentUserId = (session?.user as { id?: string })?.id

  const q = searchParams.get('q') ?? ''
  const initialTab: Tab = q.startsWith('@') ? 'people' : 'people'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [inputValue, setInputValue] = useState(q)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchUser[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync input with URL param
  useEffect(() => {
    setInputValue(q)
  }, [q])

  // Fetch suggestions when q is empty
  useEffect(() => {
    if (q) return
    setSuggestionsLoading(true)
    fetch('/api/users/top')
      .then((r) => r.json())
      .then((data) => {
        // top users don't have _count.followers, fake it
        const mapped = (data.users ?? []).map((u: Omit<SearchUser, '_count'>) => ({
          ...u,
          _count: { followers: 0 },
        }))
        setSuggestions(mapped)
      })
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false))
  }, [q])

  // Fetch search results
  const fetchResults = useCallback(async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const cleanQ = query.startsWith('@') ? query.slice(1) : query
      const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQ)}&type=all`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setPosts(data.posts ?? [])
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (q) {
      fetchResults(q)
      // Auto-switch tab if query starts with @
      if (q.startsWith('@')) setTab('people')
    }
  }, [q, fetchResults])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        router.push(`/search?q=${encodeURIComponent(val.trim())}`)
      } else {
        router.push('/search')
      }
    }, 300)
  }

  const handleClear = () => {
    setInputValue('')
    router.push('/search')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Sticky header + search bar */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-white mb-3">Rechercher</h1>
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="search"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Personnes, posts..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 text-white/30 hover:text-white/60 transition text-lg leading-none"
                aria-label="Effacer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto">
        {/* Suggestions when query is empty */}
        {!q && (
          <div className="px-4 py-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3 px-0">Membres populaires</p>
            {suggestionsLoading ? (
              <SuggestionsSkeleton />
            ) : (
              <div className="space-y-1">
                {suggestions.map((u) => (
                  <UserResultCard key={u.id} user={u} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {q && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/5 px-4 sticky top-[105px] z-10 bg-[#0f0f0f]">
              <button
                onClick={() => setTab('people')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative
                  ${tab === 'people' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Personnes
                {users.length > 0 && (
                  <span className="ml-1.5 text-xs text-white/30">({users.length})</span>
                )}
                {tab === 'people' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setTab('posts')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative
                  ${tab === 'posts' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Posts
                {posts.length > 0 && (
                  <span className="ml-1.5 text-xs text-white/30">({posts.length})</span>
                )}
                {tab === 'posts' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3 animate-pulse px-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/5 rounded w-36" />
                      <div className="h-2 bg-white/5 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* People tab */}
            {!loading && tab === 'people' && (
              <div className="py-2">
                {users.length === 0 ? (
                  <EmptyState query={q} tab="people" />
                ) : (
                  <div className="space-y-1 px-4 py-2">
                    {users.map((u) => (
                      <UserResultCard key={u.id} user={u} currentUserId={currentUserId} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Posts tab */}
            {!loading && tab === 'posts' && (
              <div className="py-4 px-4 space-y-3">
                {posts.length === 0 ? (
                  <EmptyState query={q} tab="posts" />
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white/30 text-sm">Chargement...</div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
