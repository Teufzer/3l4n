'use client'

import { useState } from 'react'

interface PostFormProps {
  onPostCreated?: () => void
  userName?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PostForm({ onPostCreated, userName = 'Moi' }: PostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MAX_CHARS = 500

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      setContent('')
      onPostCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30 flex-shrink-0 mt-0.5">
          {getInitials(userName)}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partage ta progression, tes ressentis… La communauté est là 💚"
          maxLength={MAX_CHARS + 50}
          rows={3}
          className="flex-1 bg-transparent text-white/80 placeholder:text-white/30 text-sm resize-none outline-none leading-relaxed"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs px-1">{error}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span
          className={`text-xs ${
            isOverLimit
              ? 'text-red-400'
              : isNearLimit
              ? 'text-amber-400'
              : 'text-white/30'
          }`}
        >
          {remaining} caractères
        </span>

        <button
          type="submit"
          disabled={loading || !content.trim() || isOverLimit}
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
              Publication…
            </span>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </form>
  )
}
