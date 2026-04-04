'use client'

import { useState } from 'react'

export default function EmailVerificationBanner() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })

      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors du renvoi.')
      }
    } catch {
      setError('Erreur lors du renvoi.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-emerald-400 text-sm">
          ✅ Email de confirmation envoyé ! Vérifie ta boîte mail.
        </span>
      </div>
    )
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">📧</span>
        <p className="text-amber-300 text-sm">
          Confirme ton email pour accéder à toutes les fonctionnalités.
          {error && <span className="text-red-400 ml-2">{error}</span>}
        </p>
      </div>
      <button
        onClick={handleResend}
        disabled={loading}
        className="text-amber-400 hover:text-amber-300 text-sm font-medium underline underline-offset-2 transition disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
      >
        {loading ? 'Envoi...' : 'Renvoyer l\'email →'}
      </button>
    </div>
  )
}
