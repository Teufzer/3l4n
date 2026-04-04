'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function RegisterPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2 fields
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [acceptedCGU, setAcceptedCGU] = useState(false)

  // General
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Username validation & debounced check
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

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    if (password.trim().length === 0) {
      setError('Le mot de passe ne peut pas être uniquement des espaces')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available') {
      setError('Choisis un @username disponible')
      return
    }
    if (!acceptedCGU) {
      setError('Tu dois accepter les CGU et la politique de confidentialité')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, username }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        setError('Compte créé, mais erreur à la connexion. Essaie de te connecter.')
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Erreur de connexion au serveur')
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const usernameInputClass = () => {
    const base =
      'w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition text-sm pl-8'
    if (usernameStatus === 'available') return `${base} border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500`
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`
    return `${base} border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500`
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Rejoins la communauté bienveillante.</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 shadow-xl">

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6">
            {/* Step 1 */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 1 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > 1 ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className={`text-xs font-medium transition-colors ${step === 1 ? 'text-white' : 'text-zinc-500'}`}>
                Compte
              </span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-px transition-colors ${step === 2 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />

            {/* Step 2 */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className={`text-xs font-medium transition-colors ${step === 2 ? 'text-white' : 'text-zinc-500'}`}>
                @username
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 2 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                2
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">
            {step === 1 ? 'Créer un compte' : 'Choisis ton @username'}
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-zinc-400 mb-1.5">
                  Nom d&apos;affichage
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="TonPseudo"
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-zinc-400 mb-1.5">
                  Email
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

              <div>
                <label htmlFor="password" className="block text-sm text-zinc-400 mb-1.5">
                  Mot de passe
                  <span className="ml-1 text-zinc-600 font-normal">(8 caractères min.)</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition mt-2"
              >
                Continuer →
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm text-zinc-400 mb-1.5">
                  Ton @username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium select-none">
                    @
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    placeholder="tonusername"
                    autoComplete="off"
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
                        onClick={() => {
                          setUsername(s)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-xs font-medium transition"
                      >
                        <span className="text-zinc-500">@</span>{s}
                        <span className="text-zinc-600 hover:text-emerald-500 text-xs ml-0.5">Utiliser</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-zinc-600 leading-relaxed">
                Ton @username est public et unique. Tu pourras le changer plus tard depuis tes paramètres.
              </p>

              {/* CGU checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedCGU}
                    onChange={(e) => setAcceptedCGU(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    acceptedCGU
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-transparent border-zinc-600 group-hover:border-zinc-400'
                  }`}>
                    {acceptedCGU && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-zinc-400 leading-relaxed">
                  J&apos;accepte les{' '}
                  <a href="/legal/cgu" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                    CGU
                  </a>
                  {' '}et la{' '}
                  <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                    politique de confidentialité
                  </a>
                  {' '}de 3l4n
                </span>
              </label>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-none py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition"
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || usernameStatus !== 'available' || !acceptedCGU}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer mon compte 🚀'}
                </button>
              </div>
            </form>
          )}

          {/* Google OAuth — only on step 1 */}
          {step === 1 && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">ou</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              <button
                onClick={handleGoogle}
                className="w-full py-3 px-4 rounded-xl bg-[#0f0f0f] border border-zinc-700 hover:border-zinc-500 text-white font-medium text-sm flex items-center justify-center gap-3 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
