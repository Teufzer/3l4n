'use client'

import { useState } from 'react'

interface ReportButtonProps {
  postId?: string
  commentId?: string
  postIdForComment?: string
  currentUserId?: string
}

export default function ReportButton({
  postId,
  commentId,
  postIdForComment,
  currentUserId,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!currentUserId || done) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const url = commentId
        ? `/api/posts/${postIdForComment}/comments/${commentId}/report`
        : `/api/posts/${postId}/report`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors du signalement')
      } else {
        setDone(true)
        setOpen(false)
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-white/20 hover:text-white/50 transition-colors text-[11px] px-1.5 py-1 rounded"
        title="Signaler"
        aria-label="Signaler ce contenu"
      >
        <span>⚑</span>
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-20 bg-[#1e1e1e] border border-white/10 rounded-xl p-3 shadow-xl w-64">
          <p className="text-white/70 text-xs font-semibold mb-2">Signaler ce contenu</p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décris le problème…"
              rows={3}
              maxLength={200}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors"
              autoFocus
            />
            {error && <p className="text-red-400 text-[11px]">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white/60 text-xs px-2 py-1 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || loading}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs px-3 py-1 rounded-lg transition-all"
              >
                {loading ? '…' : 'Signaler'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
