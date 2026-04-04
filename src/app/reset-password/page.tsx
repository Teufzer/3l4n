'use client'

import { useState } from 'react'; import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // F-005: password strength helper
  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } | null => {
    if (!pwd) return null
    if (pwd.length < 8) return { label: 'Trop court', color: 'bg-red-500', width: 'w-1/4' }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasDigit = /[0-9]/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const score = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length
    if (score === 0) return { label: 'Faible', color: 'bg-red-500', width: 'w-1/3' }
    if (score === 1) return { label: 'Moyen', color: 'bg-yellow-500', width: 'w-2/3' }
    return { label: 'Fort', color: 'bg-emerald-500', width: 'w-full' }
  }

  const passwordStrength = getPasswordStrength(password)

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-6">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-zinc-800 shadow-xl">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-white mb-2">Lien invalide</h2>
            <p className="text-zinc-400 text-sm mb-6">Ce lien de réinitialisation est invalide.</p>
            <Link
              href="/forgot-password"
              className="inline-block py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        router.push('/login?reset=success')
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
          <h2 className="text-xl font-semibold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-zinc-400 text-sm mb-6">Choisis un nouveau mot de passe sécurisé.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm text-zinc-400 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 caractères"
                className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              />
              {/* F-005: password strength indicator */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${passwordStrength.color} ${passwordStrength.width}`} />
                  </div>
                  <p className={`mt-1 text-xs ${
                    passwordStrength.label === 'Fort' ? 'text-emerald-400'
                    : passwordStrength.label === 'Moyen' ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    Force : {passwordStrength.label}
                  </p>
                </div>
              )}
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-xs text-red-400">Minimum 8 caractères requis ({password.length}/8)</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm text-zinc-400 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
