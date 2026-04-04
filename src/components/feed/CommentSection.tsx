'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { parseMentions } from '@/lib/parseMentions'
import ReportButton from './ReportButton'
import VerifiedBadge from '@/components/VerifiedBadge'

interface CommentAuthor {
  id: string
  name: string
  avatar?: string | null
  image?: string | null
  verified?: boolean | null
}

interface Comment {
  id: string
  content: string
  imageUrl?: string | null
  createdAt: string
  author: CommentAuthor
  likesCount: number
  likedByMe: boolean
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
  r2Enabled?: boolean
}

interface UserSuggestion {
  id: string
  username: string | null
  name: string | null
  avatar: string | null
  image: string | null
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
  const photoUrl = author.avatar || author.image

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

/** Renders comment text, turning @mentions into emerald links */
function CommentText({ content }: { content: string }) {
  const parts = content.split(/(@[\w]+)/g)
  return (
    <p className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^@[\w]+$/.test(part)) {
          const username = part.slice(1)
          return (
            <Link
              key={i}
              href={`/${username}`}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null)
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [likingComment, setLikingComment] = useState<string | null>(null)

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionSuggestions, setMentionSuggestions] = useState<UserSuggestion[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionCursorPos, setMentionCursorPos] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch mention suggestions with debounce
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionSuggestions([])
      return
    }
    if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current)
    mentionDebounceRef.current = setTimeout(async () => {
      if (!mentionQuery) {
        setMentionSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setMentionSuggestions(data.users ?? [])
          setMentionIndex(0)
        }
      } catch {
        // ignore
      }
    }, 200)
    return () => {
      if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current)
    }
  }, [mentionQuery])

  const insertMention = useCallback((user: UserSuggestion) => {
    const username = user.username ?? ''
    const before = text.slice(0, mentionCursorPos)
    const after = text.slice(mentionCursorPos).replace(/^@\w*/, '')
    const newContent = before + `@${username} ` + after
    setText(newContent)
    setMentionQuery(null)
    setMentionSuggestions([])
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = (before + `@${username} `).length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }, [text, mentionCursorPos])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)

    const cursor = e.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursor)
    const match = textBeforeCursor.match(/@(\w*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionCursorPos(cursor - match[0].length)
    } else {
      setMentionQuery(null)
      setMentionSuggestions([])
    }
  }

  const fetchComments = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setComments(data.comments.map((c: Comment) => ({
        ...c,
        likesCount: c.likesCount ?? 0,
        likedByMe: c.likedByMe ?? false,
      })))
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
        body: JSON.stringify({ content: text.trim(), imageUrl: commentImageUrl }),
      })
      if (!res.ok) throw new Error('Failed to post')
      const data = await res.json()
      setComments((prev) => [...prev, { ...data.comment, likesCount: 0, likedByMe: false }])
      setText('')
    setCommentImage(null)
    setCommentImagePreview(null)
    setCommentImageUrl(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1))
        return
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) => Math.max(i - 1, 0))
        return
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionSuggestions[mentionIndex])
        return
      } else if (e.key === 'Escape') {
        setMentionQuery(null)
        setMentionSuggestions([])
        return
      }
    }

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
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="text-white/80 text-xs font-semibold">{comment.author.name}</span>
                    {comment.author.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-white/30 text-[10px]">{formatDate(comment.createdAt)}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {/* Like button */}
                    {currentUserId && (
                      <button
                        onClick={async () => {
                          if (likingComment === comment.id) return
                          // Optimistic update
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id
                                ? {
                                    ...c,
                                    likedByMe: !c.likedByMe,
                                    likesCount: c.likedByMe ? c.likesCount - 1 : c.likesCount + 1,
                                  }
                                : c
                            )
                          )
                          setLikingComment(comment.id)
                          try {
                            const res = await fetch(
                              `/api/posts/${postId}/comments/${comment.id}/like`,
                              { method: 'POST' }
                            )
                            if (res.ok) {
                              const data = await res.json()
                              setComments((prev) =>
                                prev.map((c) =>
                                  c.id === comment.id
                                    ? { ...c, likedByMe: data.liked, likesCount: data.count }
                                    : c
                                )
                              )
                            } else {
                              // Revert on error
                              setComments((prev) =>
                                prev.map((c) =>
                                  c.id === comment.id
                                    ? {
                                        ...c,
                                        likedByMe: !c.likedByMe,
                                        likesCount: c.likedByMe ? c.likesCount - 1 : c.likesCount + 1,
                                      }
                                    : c
                                )
                              )
                            }
                          } catch {
                            // Revert on error
                            setComments((prev) =>
                              prev.map((c) =>
                                c.id === comment.id
                                  ? {
                                      ...c,
                                      likedByMe: !c.likedByMe,
                                      likesCount: c.likedByMe ? c.likesCount - 1 : c.likesCount + 1,
                                    }
                                  : c
                              )
                            )
                          } finally {
                            setLikingComment(null)
                          }
                        }}
                        className={`flex items-center gap-0.5 text-[10px] transition-colors ${
                          comment.likedByMe
                            ? 'text-red-400'
                            : 'text-white/30 hover:text-red-400'
                        }`}
                        title={comment.likedByMe ? 'Retirer le like' : 'Liker'}
                        disabled={likingComment === comment.id}
                      >
                        <span>❤️</span>
                        {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                      </button>
                    )}
                    <ReportButton
                      commentId={comment.id}
                      postIdForComment={postId}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
                <CommentText content={comment.content} />
                {comment.imageUrl && (
                  <img
                    src={comment.imageUrl}
                    alt=""
                    className="mt-1.5 max-h-48 rounded-xl object-cover border border-white/5 cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(comment.imageUrl!, '_blank')}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Preview image commentaire */}
          {commentImagePreview && (
            <div className="relative inline-block mx-2 mb-1">
              <img src={commentImagePreview} alt="" className="max-h-20 rounded-xl border border-white/10" />
              {imageUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"><span className="text-xs text-white">⏳</span></div>}
              {!imageUploading && <button type="button" onClick={() => { setCommentImage(null); setCommentImagePreview(null); setCommentImageUrl(null) }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">✕</button>}
            </div>
          )}

          {/* Input form */}
          {currentUserId ? (
            <form onSubmit={handleSubmit} className="flex gap-2 items-end relative">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={300}
                  placeholder="Ajouter un commentaire… tape @ pour mentionner"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-colors"
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                />

                {/* Mention suggestions dropdown */}
                {mentionSuggestions.length > 0 && (
                  <div className="absolute left-0 bottom-full mb-1 z-50 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl overflow-hidden w-52">
                    {mentionSuggestions.map((user, i) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          insertMention(user)
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                          i === mentionIndex
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {user.avatar || user.image ? (
                          <img
                            src={user.avatar ?? user.image ?? ''}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {(user.name ?? user.username ?? '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">@{user.username}</div>
                          {user.name && (
                            <div className="text-[10px] text-white/40 truncate">{user.name}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton photo */}
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  id="comment-image-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
                    setCommentImage(file)
                    setCommentImagePreview(URL.createObjectURL(file))
                    setImageUploading(true)
                    try {
                      const fd = new FormData(); fd.append('file', file)
                      const r = await fetch('/api/upload', { method: 'POST', body: fd })
                      if (r.ok) { const d = await r.json(); setCommentImageUrl(d.publicUrl) }
                    } finally { setImageUploading(false) }
                    e.target.value = ''
                  }}
                />
                <label
                  htmlFor="comment-image-input"
                  className="flex-shrink-0 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition cursor-pointer text-sm"
                  title="Ajouter une photo"
                >
                  📷
                </label>
              </>
              <button
                type="submit"
                disabled={!text.trim() || submitting || imageUploading}
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
