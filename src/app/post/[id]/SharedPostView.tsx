'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseMentions } from '@/lib/parseMentions'
import VerifiedBadge from '@/components/VerifiedBadge'

type ReactionType = 'COURAGE' | 'EN_FEU' | 'SOLIDAIRE'

interface Author {
  id: string
  name: string
  username?: string | null
  avatar?: string | null
  image?: string | null
  verified?: boolean | null
}

interface CommentLike { userId: string }

interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
  likesCount?: number
  likedByMe?: boolean
  likes?: CommentLike[]
}

interface Reaction { id: string; type: ReactionType; userId: string }

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
  repostsCount?: number
  repostedByMe?: boolean
}

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'COURAGE', emoji: '💪' },
  { type: 'EN_FEU', emoji: '🔥' },
  { type: 'SOLIDAIRE', emoji: '❤️' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function Avatar({ author, size = 'md' }: { author: Author; size?: 'sm' | 'md' | 'lg' }) {
  const src = author.avatar || author.image
  const cls = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const initials = (author.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (src) return <img src={src} alt={author.name} className={`${cls} rounded-full object-cover ring-1 ring-white/10 flex-shrink-0`} />
  return <div className={`${cls} rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0`}>{initials}</div>
}

export default function SharedPostView({ post: initialPost, currentUserId }: { post: SharedPost; currentUserId?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = currentUserId || session?.user?.id

  const [reactions, setReactions] = useState<Reaction[]>(initialPost.reactions)
  const [reacted, setReacted] = useState<ReactionType | null>(null)
  const [repostsCount, setRepostsCount] = useState(initialPost.repostsCount ?? 0)
  const [repostedByMe, setRepostedByMe] = useState(initialPost.repostedByMe ?? false)
  const [comments, setComments] = useState<Comment[]>(initialPost.comments)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const init: Record<string, { count: number; liked: boolean }> = {}
    for (const c of initialPost.comments) {
      init[c.id] = { count: c.likesCount ?? 0, liked: c.likedByMe ?? false }
    }
    return init
  })

  const authorHref = initialPost.author.username ? `/${initialPost.author.username}` : `/profile/${initialPost.author.id}`

  const countByType = (type: ReactionType) => reactions.filter(r => r.type === type).length
  const myReaction = reactions.find(r => r.userId === userId)?.type ?? null
  const totalReactions = reactions.length

  const handleReact = async (type: ReactionType) => {
    if (!userId) { toast.error('Connecte-toi pour réagir'); return }
    const prev = [...reactions]
    // optimistic
    const already = reactions.find(r => r.userId === userId && r.type === type)
    if (already) {
      setReactions(reactions.filter(r => !(r.userId === userId && r.type === type)))
    } else {
      setReactions([...reactions.filter(r => r.userId !== userId), { id: 'tmp', type, userId }])
    }
    try {
      await fetch(`/api/posts/${initialPost.id}/react`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
    } catch { setReactions(prev) }
  }

  const handleRepost = async () => {
    if (!userId) { toast.error('Connecte-toi pour reposer'); return }
    const prev = { repostsCount, repostedByMe }
    setRepostedByMe(!repostedByMe)
    setRepostsCount(c => repostedByMe ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/posts/${initialPost.id}/repost`, { method: 'POST' })
      if (!res.ok) { setRepostedByMe(prev.repostedByMe); setRepostsCount(prev.repostsCount) }
    } catch { setRepostedByMe(prev.repostedByMe); setRepostsCount(prev.repostsCount) }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`https://3l4n.com/post/${initialPost.id}`)
    toast.success('Lien copié !')
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${initialPost.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const newComment = data.comment
        setComments(prev => [newComment, ...prev])
        setCommentLikes(prev => ({ ...prev, [newComment.id]: { count: 0, liked: false } }))
        setCommentText('')
      }
    } finally { setSubmitting(false) }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!userId) { toast.error('Connecte-toi pour liker'); return }
    const prev = commentLikes[commentId] || { count: 0, liked: false }
    setCommentLikes(p => ({ ...p, [commentId]: { count: prev.liked ? prev.count - 1 : prev.count + 1, liked: !prev.liked } }))
    try {
      await fetch(`/api/posts/${initialPost.id}/comments/${commentId}/like`, { method: 'POST' })
    } catch { setCommentLikes(p => ({ ...p, [commentId]: prev })) }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition text-white/70">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-lg">Post</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Auteur */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={authorHref}><Avatar author={initialPost.author} size="lg" /></Link>
          <div>
            <Link href={authorHref} className="flex items-center gap-1 hover:underline">
              <span className="text-white font-bold text-base">{initialPost.author.name}</span>
              {initialPost.author.verified && <VerifiedBadge className="w-4 h-4" />}
            </Link>
            {initialPost.author.username && (
              <p className="text-white/40 text-sm">@{initialPost.author.username}</p>
            )}
          </div>
        </div>

        {/* Contenu */}
        <p className="text-white text-xl leading-relaxed mb-3 whitespace-pre-wrap">
          {parseMentions(initialPost.content)}
        </p>

        {/* Image */}
        {initialPost.imageUrl && (
          <div className="mb-3">
            <img
              src={initialPost.imageUrl}
              alt="Image du post"
              className="w-full rounded-2xl object-cover max-h-96 cursor-pointer border border-white/5"
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        )}

        {/* Date */}
        <p className="text-white/30 text-sm mb-4">{formatDate(initialPost.createdAt)}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 py-3 border-y border-white/5 mb-3 text-sm">
          <span className="text-white/60">
            <span className="text-white font-bold">{repostsCount}</span> Reposts
          </span>
          <span className="text-white/60">
            <span className="text-white font-bold">{totalReactions}</span> Réactions
          </span>
          <span className="text-white/60">
            <span className="text-white font-bold">{comments.length}</span> Commentaires
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-4">
          {/* Réactions */}
          <div className="flex items-center gap-1">
            {REACTIONS.map(({ type, emoji }) => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all
                  ${myReaction === type ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <span>{emoji}</span>
                {countByType(type) > 0 && <span className="text-xs">{countByType(type)}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {/* Repost */}
            <button
              onClick={handleRepost}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                ${repostedByMe ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {repostsCount > 0 && <span>{repostsCount}</span>}
            </button>

            {/* Partager */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              🔗
            </button>
          </div>
        </div>

        {/* Formulaire commentaire */}
        {userId ? (
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(session?.user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Ajoute un commentaire..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-full transition disabled:opacity-40"
              >
                {submitting ? '…' : 'Envoyer'}
              </button>
            </div>
          </form>
        ) : (
          <Link href="/login" className="block text-center text-emerald-400 hover:underline text-sm mb-6">
            Connecte-toi pour commenter →
          </Link>
        )}

        {/* Commentaires */}
        <div className="space-y-4" id="comments">
          {comments.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">Aucun commentaire — sois le premier ! 👇</p>
          )}
          {comments.map(comment => {
            const cHref = comment.author.username ? `/${comment.author.username}` : `/profile/${comment.author.id}`
            const cl = commentLikes[comment.id] || { count: 0, liked: false }
            return (
              <div key={comment.id} className="flex gap-3">
                <Link href={cHref} className="flex-shrink-0"><Avatar author={comment.author} size="sm" /></Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Link href={cHref} className="flex items-center gap-1 hover:underline">
                      <span className="text-white text-sm font-semibold">{comment.author.name}</span>
                      {(comment.author as { verified?: boolean }).verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                    </Link>
                    {comment.author.username && (
                      <span className="text-white/30 text-xs">@{comment.author.username}</span>
                    )}
                    <span className="text-white/20 text-xs">· {formatRelative(comment.createdAt)}</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {parseMentions(comment.content)}
                  </p>
                  {/* Actions commentaire */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={() => handleCommentLike(comment.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${cl.liked ? 'text-red-400' : 'text-white/30 hover:text-red-400'}`}
                    >
                      <span>{cl.liked ? '❤️' : '🤍'}</span>
                      {cl.count > 0 && <span>{cl.count}</span>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && initialPost.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <img src={initialPost.imageUrl} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
