'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface UsernameOnboardingModalProps {
  userName?: string | null
}

export default function UsernameOnboardingModal({ userName }: UsernameOnboardingModalProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const firstName = userName ? userName.split(' ')[0] : 'toi'

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle')
      setUsernameError('')
      setSuggestions([])
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid')
      setUsernameError('3 à 30 caractères, lettres, chiffres ou _')
      setSuggestions([])
      return
    }

    setUsernameStatus('checking')
    setUsernameError('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?q=${encodeURIComponent(username)}`)
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
          setSuggestions([])
        } else {
          setUsernameStatus('taken')
          setSuggestions(data.suggestions || [])
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available') {
      setError('Choisis un @username disponible')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
      setLoading(false)
    }
  }

  const usernameInputClass = () => {
    const base =
      'w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition text-sm pl-8'
    if (usernameStatus === 'available') return `${base} border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500`
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`
    return `${base} border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-bold text-white">
            Choisis ton @username, {firstName} !
          </h2>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            Ton identifiant unique sur 3l4n. Les autres pourront te mentionner avec ce @.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username-onboarding" className="block text-sm font-medium text-zinc-300 mb-2">
              @username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium select-none">
                @
              </span>
              <input
                id="username-onboarding"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                placeholder="tonusername"
                autoComplete="off"
                autoFocus
                className={usernameInputClass()}
              />
              {/* Status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && (
                  <svg className="w-4 h-4 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {usernameStatus === 'available' && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* Status messages */}
            {usernameStatus === 'available' && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <span>✅</span> Disponible !
              </p>
            )}
            {usernameStatus === 'taken' && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <span>❌</span> Déjà pris
              </p>
            )}
            {usernameStatus === 'invalid' && (
              <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
            )}
          </div>

          {/* Suggestions */}
          {usernameStatus === 'taken' && suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Suggestions disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUsername(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-xs font-medium transition"
                  >
                    <span className="text-zinc-500">@</span>{s}
                    <span className="text-zinc-600 text-xs ml-0.5">Utiliser</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available'}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enregistrement...
              </span>
            ) : (
              'Choisir ce @username 🎉'
            )}
          </button>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-zinc-600 text-xs hover:text-zinc-400 transition text-center"
          >
            Passer pour l&apos;instant
          </button>
        </form>
      </div>
    </div>
  )
}
