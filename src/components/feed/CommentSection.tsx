'use client'

import { useState, useRef } from 'react'
import ReportButton from './ReportButton'

interface CommentAuthor {
  id: string
  name: string
  avatar?: string | null
  image?: string | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Avatar({ author, size = 'sm' }: { author: CommentAuthor; size?: 'sm' | 'xs' }) {
  const dim = size === 'xs' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  const photoUrl = author.image || author.avatar

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={author.name}
        className={`${dim} rounded-full object-cover ring-1 ring-emerald-500/30 flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${dim} rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold ring-1 ring-emerald-500/30 flex-shrink-0`}
    >
      {getInitials(author.name)}
    </div>
  )
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchComments = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setComments(data.comments)
      setLoaded(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    if (next) {
      fetchComments()
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      })
      if (!res.ok) throw new Error('Failed to post')
      const data = await res.json()
      setComments((prev) => [...prev, data.comment])
      setText('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="pt-1">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 active:scale-95"
      >
        <span>💬</span>
        <span>
          {comments.length > 0
            ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}`
            : 'Commenter'}
        </span>
        <span className="text-white/30">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Collapsible section */}
      {isOpen && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          {/* Loading */}
          {loading && (
            <p className="text-white/30 text-xs text-center py-2">Chargement…</p>
          )}

          {/* Comments list */}
          {!loading && comments.length === 0 && loaded && (
            <p className="text-white/30 text-xs text-center py-2">
              Aucun commentaire. Sois le premier ! 🌱
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 items-start">
              <Avatar author={comment.author} size="xs" />
              <div className="flex-1 min-w-0 bg-white/5 rounded-xl px-3 py-2">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-white/80 text-xs font-semibold">
                    {comment.author.name}
                  </span>
                  <span className="text-white/30 text-[10px]">{formatDate(comment.createdAt)}</span>
                  <div className="ml-auto">
                    <ReportButton
                      commentId={comment.id}
                      postIdForComment={postId}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
                <p className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {/* Input form */}
          {currentUserId ? (
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={300}
                placeholder="Ajouter un commentaire… (Entrée pour envoyer)"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-colors"
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {submitting ? '…' : '→'}
              </button>
            </form>
          ) : (
            <p className="text-white/30 text-xs text-center">
              Connecte-toi pour commenter
            </p>
          )}
        </div>
      )}
    </div>
  )
}
