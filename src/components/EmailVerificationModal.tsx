'use client'

import { useState } from 'react'

interface Props {
  email?: string | null
}

export default function EmailVerificationModal({ email }: Props) {
  const [open, setOpen] = useState(true)
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
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-4xl">
            📧
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-white font-bold text-lg">Vérifie ton email</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Pour pouvoir poster, commenter et participer à la communauté, tu dois confirmer ton adresse email.
          </p>
          {email && (
            <p className="text-emerald-400 text-sm font-medium">{email}</p>
          )}
        </div>

        {sent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
            <p className="text-emerald-400 text-sm">✅ Email envoyé ! Vérifie ta boîte mail.</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition disabled:opacity-50"
            >
              {loading ? 'Envoi…' : 'Renvoyer l\'email de vérification'}
            </button>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          </>
        )}

        {/* Skip */}
        <button
          onClick={() => setOpen(false)}
          className="w-full text-white/30 hover:text-white/50 text-xs transition text-center py-1"
        >
          Continuer en mode lecture seule →
        </button>
      </div>
    </div>
  )
}
