'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import CommentSection from '@/components/feed/CommentSection'
import { ReactionType, Reaction } from '@/components/feed/PostCard'

interface CommentAuthor {
  id: string
  name: string
  username?: string | null
  avatar?: string | null
  image?: string | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

interface Author {
  id: string
  name: string
  username?: string | null
  avatar?: string | null
  image?: string | null
}

interface SharedPost {
  id: string
  content: string
  originalContent?: string | null
  editedAt?: string | null
  imageUrl?: string | null
  createdAt: string
  author: Author
  reactions: Reaction[]
  comments: Comment[]
}

interface Props {
  post: SharedPost
  currentUserId?: string
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'COURAGE', emoji: '💪', label: 'Courage' },
  { type: 'EN_FEU', emoji: '🔥', label: 'En feu' },
  { type: 'SOLIDAIRE', emoji: '❤️', label: 'Solidaire' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SharedPostView({ post, currentUserId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>(post.reactions)
  const [loading, setLoading] = useState<ReactionType | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  const countByType = (type: ReactionType) => reactions.filter((r) => r.type === type).length
  const hasReacted = (type: ReactionType) =>
    currentUserId ? reactions.some((r) => r.type === type && r.userId === currentUserId) : false

  const handleReact = async (type: ReactionType) => {
    if (!currentUserId || loading) return
    setLoading(type)
    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReactions(data.reactions)
    } catch {
      toast.error('Impossible de réagir pour l\'instant')
    } finally {
      setLoading(null)
    }
  }

  const handleShare = async () => {
    const url = `https://3l4n.com/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié dans le presse-papiers !')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const authorHref = post.author.username
    ? `/${post.author.username}`
    : `/profile/${post.author.id}`

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Back */}
          <Link
            href={currentUserId ? '/feed' : '/'}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{currentUserId ? 'Feed' : 'Accueil'}</span>
          </Link>

          {/* Logo */}
          <span className="font-bold text-lg text-white">
            3l<span className="text-emerald-500">4</span>n
          </span>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
            aria-label="Partager ce post"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-24">
        <article className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-4">
          {/* Author */}
          <div className="flex items-center gap-3">
            <Link href={authorHref} className="flex-shrink-0 group">
              {post.author.image || post.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(post.author.image || post.author.avatar)!}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition-all">
                  {getInitials(post.author.name)}
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={authorHref}
                className="text-white font-semibold text-sm hover:text-emerald-400 transition-colors truncate block"
              >
                {post.author.name}
              </Link>
              {post.author.username && (
                <p className="text-white/40 text-xs">@{post.author.username}</p>
              )}
              <p className="text-white/40 text-xs mt-0.5">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
              {showOriginal ? post.originalContent : post.content}
            </p>
            {post.editedAt && (
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs">✏️ modifié</span>
                {post.originalContent && (
                  <button
                    onClick={() => setShowOriginal((v) => !v)}
                    className="text-xs text-white/30 hover:text-emerald-400 underline underline-offset-2 transition-colors"
                  >
                    {showOriginal ? 'voir actuel' : 'voir original'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          {post.imageUrl && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
              aria-label="Voir la photo en grand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt="Photo du post"
                className="w-full max-h-80 object-cover rounded-xl border border-white/5 hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </button>
          )}

          {/* Reactions */}
          <div className="flex gap-2 flex-wrap">
            {REACTIONS.map(({ type, emoji, label }) => {
              const count = countByType(type)
              const reacted = hasReacted(type)
              return (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  disabled={!currentUserId || loading === type}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${reacted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
                    }
                    ${!currentUserId ? 'cursor-default' : loading === type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                  `}
                  title={currentUserId ? label : 'Connecte-toi pour réagir'}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              )
            })}
          </div>

          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            <span>🔗</span>
            <span>Partager ce post</span>
          </button>

          {/* Not logged in nudge */}
          {!currentUserId && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center space-y-2">
              <p className="text-white/70 text-sm">Rejoins 3l4n pour réagir et commenter</p>
              <div className="flex gap-2 justify-center">
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors"
                >
                  S&apos;inscrire
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </article>

        {/* Comments */}
        <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
          <h2 className="text-white/60 text-sm font-medium mb-3">
            Commentaires ({post.comments.length})
          </h2>
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </section>
      </main>

      {/* Lightbox */}
      {lightboxOpen && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en grand"
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <span>Fermer</span>
              <span aria-hidden="true">✕</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt="Photo du post"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  )
}
