'use client'

import { useState } from 'react'
import CommentSection from './CommentSection'
import ReportButton from './ReportButton'

export type ReactionType = 'COURAGE' | 'EN_FEU' | 'SOLIDAIRE'

export interface Reaction {
  id: string
  type: ReactionType
  userId: string
}

export interface Post {
  id: string
  content: string
  imageUrl?: string | null
  createdAt: string
  author: {
    id: string
    name: string
    avatar?: string | null
    image?: string | null
  }
  reactions: Reaction[]
}

interface PostCardProps {
  post: Post
  currentUserId?: string
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'COURAGE', emoji: '💪', label: 'Courage' },
  { type: 'EN_FEU', emoji: '🔥', label: 'En feu' },
  { type: 'SOLIDAIRE', emoji: '❤️', label: 'Solidaire' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
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

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [reactions, setReactions] = useState<Reaction[]>(post.reactions)
  const [loading, setLoading] = useState<ReactionType | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const countByType = (type: ReactionType) =>
    reactions.filter((r) => r.type === type).length

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

      if (!res.ok) throw new Error('Failed to react')
      const data = await res.json()
      setReactions(data.reactions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <article className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-3 relative">
          {(post.author.image || post.author.avatar) ? (
            <img
              src={(post.author.image || post.author.avatar)!}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold ring-2 ring-emerald-500/30 flex-shrink-0">
              {getInitials(post.author.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm truncate">{post.author.name}</p>
            <p className="text-white/40 text-xs">{formatDate(post.createdAt)}</p>
          </div>
          <div className="ml-auto">
            <ReportButton postId={post.id} currentUserId={currentUserId} />
          </div>
        </div>

        {/* Content */}
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Image */}
        {post.imageUrl && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="block w-full mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            aria-label="Voir la photo en grand"
          >
            <img
              src={post.imageUrl}
              alt="Photo du post"
              className="w-full max-h-72 object-cover rounded-xl border border-white/5 hover:opacity-90 transition-opacity cursor-zoom-in"
            />
          </button>
        )}

        {/* Reactions */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {REACTIONS.map(({ type, emoji, label }) => {
            const count = countByType(type)
            const reacted = hasReacted(type)
            return (
              <button
                key={type}
                onClick={() => handleReact(type)}
                disabled={loading === type}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${reacted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
                  }
                  ${loading === type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                `}
                title={label}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Comments */}
        <CommentSection postId={post.id} currentUserId={currentUserId} />
      </article>

      {/* Lightbox modal */}
      {lightboxOpen && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en grand"
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
              aria-label="Fermer"
            >
              <span>Fermer</span>
              <span aria-hidden="true">✕</span>
            </button>
            <img
              src={post.imageUrl}
              alt="Photo du post"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </>
  )
}
