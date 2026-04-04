'use client'

import { useEffect, useState } from 'react'; import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (res.ok) {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 2500)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    verify()
  }, [token, router])

  const handleResend = async () => {
    setResendLoading(true)
    setResendMessage('')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (res.ok) {
        setResendMessage('Email renvoyé ! Vérifie ta boîte mail.')
      } else {
        const data = await res.json()
        setResendMessage(data.error || 'Erreur lors du renvoi.')
      }
    } catch {
      setResendMessage('Erreur lors du renvoi.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            3l<span className="text-emerald-500">4</span>n
          </h1>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-zinc-800 shadow-xl text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Vérification en cours...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-white mb-2">Email confirmé !</h2>
              <p className="text-zinc-400 text-sm">Redirection vers ton dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-white mb-2">Lien invalide ou expiré</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Ce lien de vérification est invalide ou a déjà été utilisé.
              </p>

              {resendMessage ? (
                <p className="text-emerald-400 text-sm mb-4">{resendMessage}</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {resendLoading ? 'Envoi...' : 'Renvoyer un email de vérification'}
                </button>
              )}

              <Link
                href="/dashboard"
                className="text-zinc-500 hover:text-zinc-300 text-sm transition"
              >
                Retour au dashboard →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
