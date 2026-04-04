'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseMentions } from '@/lib/parseMentions'
import VerifiedBadge from '@/components/VerifiedBadge'
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
  originalContent?: string | null
  editedAt?: string | null
  imageUrl?: string | null
  createdAt: string
  author: {
    id: string
    name: string
    avatar?: string | null
    image?: string | null
  }
  reactions: Reaction[]
  commentsCount?: number
  repostsCount?: number
  repostedByMe?: boolean
  isRepost?: boolean
  reposterId?: string | null
  repostedAt?: string | null
}

interface PostCardProps {
  post: Post
  currentUserId?: string
  isAdmin?: boolean
  onDeleted?: (postId: string) => void
  onUpdated?: (post: Post) => void
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

export default function PostCard({ post, currentUserId, isAdmin, onDeleted, onUpdated }: PostCardProps) {
  const authorHref = (post.author as { username?: string }).username
    ? `/${(post.author as { username?: string }).username}`
    : `/profile/${post.author.id}`

  const [reactions, setReactions] = useState<Reaction[]>(post.reactions)
  const [loading, setLoading] = useState<ReactionType | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [repostsCount, setRepostsCount] = useState(post.repostsCount ?? 0)
  const [repostedByMe, setRepostedByMe] = useState(post.repostedByMe ?? false)
  const [repostLoading, setRepostLoading] = useState(false)

  // Edit/delete state
  const [menuOpen, setMenuOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentContent, setCurrentContent] = useState(post.content)
  const [currentOriginal, setCurrentOriginal] = useState(post.originalContent)
  const [currentEditedAt, setCurrentEditedAt] = useState(post.editedAt)
  const [showOriginal, setShowOriginal] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const isOwn = currentUserId && post.author.id === currentUserId
  const canModerate = isOwn || isAdmin

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const countByType = (type: ReactionType) =>
    reactions.filter((r) => r.type === type).length

  const hasReacted = (type: ReactionType) =>
    currentUserId ? reactions.some((r) => r.type === type && r.userId === currentUserId) : false

  const handleRepost = async () => {
    if (!currentUserId || repostLoading) return
    // Optimistic update
    const wasReposted = repostedByMe
    setRepostedByMe(!wasReposted)
    setRepostsCount((c) => (wasReposted ? c - 1 : c + 1))
    setRepostLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setRepostedByMe(data.reposted)
        setRepostsCount(data.count)
      } else {
        // Revert
        setRepostedByMe(wasReposted)
        setRepostsCount((c) => (wasReposted ? c + 1 : c - 1))
      }
    } catch {
      // Revert
      setRepostedByMe(wasReposted)
      setRepostsCount((c) => (wasReposted ? c + 1 : c - 1))
    } finally {
      setRepostLoading(false)
    }
  }

  const handleShare = async () => {
    const url = `https://3l4n.com/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié !')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

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

  const handleEdit = async () => {
    if (!editContent.trim() || editLoading) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!res.ok) throw new Error('Erreur lors de la modification')
      const data = await res.json()
      const updated: Post = { ...post, ...data.post }
      setCurrentContent(data.post.content)
      setCurrentOriginal(data.post.originalContent ?? null)
      setCurrentEditedAt(data.post.editedAt ?? null)
      setShowOriginal(false)
      setEditModalOpen(false)
      setMenuOpen(false)
      toast.success('Post modifié ✏️')
      onUpdated?.(updated)
    } catch (err) {
      console.error(err)
      toast.error('Impossible de modifier le post')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    // modal handles confirmation
    setDeleteLoading(true)
    setMenuOpen(false)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success('Post supprimé')
      onDeleted?.(post.id)
    } catch (err) {
      console.error(err)
      toast.error('Impossible de supprimer le post')
      setDeleteLoading(false)
    }
  }

  const openEditModal = () => {
    setEditContent(currentContent)
    setEditModalOpen(true)
    setMenuOpen(false)
  }

  return (
    <>
      <article
        className={`bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-colors ${deleteLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 relative">
          <Link href={authorHref} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {(post.author.avatar || post.author.image) ? (
              <img
                src={(post.author.avatar || post.author.image)!}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 hover:ring-emerald-400 transition"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold ring-2 ring-emerald-500/30 hover:ring-emerald-400 transition flex-shrink-0">
                {getInitials(post.author.name)}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={authorHref} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:underline w-fit">
              <p className="text-white font-semibold text-sm truncate">{post.author.name}</p>
              {(post.author as { verified?: boolean }).verified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
            </Link>
            <Link
              href={`/post/${post.id}`}
              className="text-white/40 text-xs hover:text-emerald-400 transition-colors"
              title="Voir le post"
            >
              {formatDate(post.createdAt)}
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={`/post/${post.id}`}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1"
              title="Voir les commentaires"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {(post.commentsCount ?? 0) > 0 && <span className="text-xs">{post.commentsCount}</span>}
            </Link>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              aria-label="Partager ce post"
              title="Copier le lien"
            >
              🔗
            </button>
            <ReportButton postId={post.id} currentUserId={currentUserId} />

            {/* ··· menu — visible uniquement sur ses propres posts */}
            {canModerate && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-base leading-none"
                  aria-label="Options du post"
                  title="Options"
                >
                  ···
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 w-36 bg-[#222] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <button
                      onClick={openEditModal}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <span>✏️</span> Modifier
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteModalOpen(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <span>🗑️</span> Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
            {parseMentions(showOriginal ? (currentOriginal ?? '') : currentContent)}
          </p>

          {/* Badge modifié + toggle original */}
          {currentEditedAt && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-white/30 text-xs">✏️ modifié</span>
              {currentOriginal && (
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

        {/* Actions — réactions + repost + commentaires + partager */}
        <div className="flex items-center gap-1 pt-1 flex-wrap">
          {REACTIONS.map(({ type, emoji, label }) => {
            const count = countByType(type)
            const reacted = hasReacted(type)
            return (
              <button
                key={type}
                onClick={() => handleReact(type)}
                disabled={loading === type}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all
                  ${reacted ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/50 hover:bg-white/5 hover:text-white/70'}
                  ${loading === type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                `}
                title={label}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}

          {/* Repost */}
          {currentUserId && (
            <button
              onClick={handleRepost}
              disabled={repostLoading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all
                ${repostedByMe ? 'text-emerald-400' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                ${repostLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
              title={repostedByMe ? 'Annuler' : 'Repost'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {repostsCount > 0 && <span>{repostsCount}</span>}
            </button>
          )}
        </div>

        {/* Comments collapsed */}
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

      {/* Modal de modification */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => !editLoading && setEditModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Modifier le post"
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-full max-w-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-base">Modifier le post</h2>
              <button
                onClick={() => !editLoading && setEditModalOpen(false)}
                className="text-white/40 hover:text-white/70 transition-colors text-lg leading-none"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              maxLength={1000}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition-all"
              placeholder="Que veux-tu dire ?"
              disabled={editLoading}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-white/20 text-xs">{editContent.length}/1000</span>
              <div className="flex gap-2">
                <button
                  onClick={() => !editLoading && setEditModalOpen(false)}
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/20 hover:text-white/80 transition-all disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editLoading || !editContent.trim() || editContent.trim() === currentContent}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editLoading ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression custom */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-white font-bold text-lg">Supprimer ce post ?</h2>
              <p className="text-white/40 text-sm">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => { setDeleteModalOpen(false); handleDelete() }}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {deleteLoading ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
