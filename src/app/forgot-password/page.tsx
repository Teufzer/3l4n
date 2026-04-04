'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Une erreur est survenue.')
      }
    } catch {
      setError('Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Ton parcours. Ta progression.</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-2">Mot de passe oublié</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Saisis ton adresse email et on t&apos;envoie un lien pour réinitialiser ton mot de passe.
          </p>

          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Si un compte existe avec cet email, tu recevras un lien de réinitialisation.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-emerald-500 hover:text-emerald-400 text-sm font-medium transition"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm text-zinc-400 mb-1.5">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="toi@exemple.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-zinc-500 hover:text-zinc-300 text-sm transition"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
