'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

interface PostFormProps {
  onPostCreated?: () => void
  userName?: string
  userImage?: string
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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export default function PostForm({ onPostCreated, userName = 'Moi', userImage, r2Enabled = false }: PostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photo state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionSuggestions, setMentionSuggestions] = useState<UserSuggestion[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionCursorPos, setMentionCursorPos] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MAX_CHARS = 500

  // Fetch mention suggestions
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

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

  const insertMention = (user: UserSuggestion) => {
    const username = user.username ?? ''
    const before = content.slice(0, mentionCursorPos)
    const after = content.slice(mentionCursorPos).replace(/^@\w*/, '')
    const newContent = before + `@${username} ` + after
    setContent(newContent)
    setMentionQuery(null)
    setMentionSuggestions([])
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = (before + `@${username} `).length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionSuggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMentionIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(mentionSuggestions[mentionIndex])
    } else if (e.key === 'Escape') {
      setMentionQuery(null)
      setMentionSuggestions([])
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilise jpg, png, gif ou webp.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image trop lourde (max 10 Mo).')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(localUrl)
    setUploadedImageUrl(null)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de l'envoi de la photo")
      }

      const { publicUrl } = await res.json()
      setUploadedImageUrl(publicUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
      setSelectedFile(null)
      setPreviewUrl(null)
      URL.revokeObjectURL(localUrl)
    } finally {
      setUploading(false)
    }
  }, [])

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedImageUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || loading) return

    if (uploading) {
      toast.error("La photo est encore en cours d'envoi, patiente un instant...")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      setContent('')
      handleRemovePhoto()
      onPostCreated?.()
      toast.success('Post publie ! 💪')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0
  const isNearLimit = remaining <= 50 && !isOverLimit

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30 flex-shrink-0 mt-0.5">
            {getInitials(userName)}
          </div>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Partage ta progression, tes ressentis... La communaute est la 💚"
            maxLength={MAX_CHARS + 50}
            rows={3}
            className="w-full bg-transparent text-white/80 placeholder:text-white/30 text-sm resize-none outline-none leading-relaxed"
            disabled={loading}
          />

          {mentionSuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl overflow-hidden w-56">
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar ?? user.image ?? ''}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
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
      </div>

      {previewUrl && (
        <div className="relative inline-block ml-13">
          <img
            src={previewUrl}
            alt="Apercu de la photo"
            className="max-h-32 max-w-xs rounded-xl border border-white/10 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors"
              aria-label="Supprimer la photo"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs px-1">{error}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-3">
          {r2Enabled && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileInputChange}
                aria-label="Ajouter une photo"
              />
              <button
                type="button"
                onClick={handlePhotoButtonClick}
                disabled={loading || uploading || !!selectedFile}
                className="text-white/40 hover:text-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                title="Ajouter une photo"
                aria-label="Ajouter une photo"
              >
                📷
              </button>
            </>
          )}

          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-red-400'
                : isNearLimit
                ? 'text-amber-400'
                : 'text-white/30'
            }`}
          >
            {remaining} caracteres
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim() || isOverLimit || uploading}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold
            hover:bg-emerald-400 active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Publication...
            </span>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </form>
  )
}
