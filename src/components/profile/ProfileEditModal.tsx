'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileEditModalProps {
  userId: string
  currentName: string
  currentBio: string
}

export default function ProfileEditModal({
  userId,
  currentName,
  currentBio,
}: ProfileEditModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [bio, setBio] = useState(currentBio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const handleClose = () => {
    if (loading) return
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Le nom est requis')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, bio: bio.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 transition font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Modifier mon profil
      </button>

      {open && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      >
        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-2xl p-6 shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">Modifier le profil</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-zinc-500 hover:text-white transition p-1"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">
                Nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton prénom ou pseudo"
                maxLength={50}
                disabled={loading}
                className="w-full bg-[#0f0f0f] border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Parle un peu de toi, tes objectifs…"
                rows={3}
                maxLength={200}
                disabled={loading}
                className="w-full bg-[#0f0f0f] border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition resize-none disabled:opacity-50"
              />
              <p className="text-right text-xs text-zinc-600 mt-1">{200 - bio.length} restants</p>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-500 hover:text-zinc-300 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sauvegarde…
                  </span>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </>
  )
}
