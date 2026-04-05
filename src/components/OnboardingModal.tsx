'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OnboardingModalProps {
  userName?: string | null
  onSkipped?: () => void
}

export default function OnboardingModal({ userName, onSkipped }: OnboardingModalProps) {
  const [open, setOpen] = useState(true)
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(weight)
    if (!w || w <= 0 || w > 500) {
      toast.error('Entre un poids valide (ex: 85)')
      return
    }

    setLoading(true)
    try {
      // Save weight entry
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: w,
          note: 'Premier pesée 🌱',
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')

      // Save target weight if provided
      const target = parseFloat(targetWeight)
      if (target && target > 0 && target < w) {
        await fetch('/api/user/target', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetWeight: target }),
        })
      }

      toast.success(`Bienvenue dans l'aventure ${userName ? userName.split(' ')[0] : ''} ! 🎉`)
      setOpen(false)
      router.refresh()
      router.push('/dashboard')
    } catch {
      toast.error('Oups, quelque chose a planté. Réessaie !')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setOpen(false)
    onSkipped?.()
  }

  const firstName = userName ? userName.split(' ')[0] : 'toi'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🌱</div>
          <h2 className="text-xl font-bold text-white">
            Bienvenue, {firstName} !
          </h2>
          <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
            On est super content que tu sois là.
            Commençons par une chose simple.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Weight field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Quel est ton poids aujourd&apos;hui ?
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 85"
                required
                className="w-full bg-[#1f1f1f] border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-lg font-medium outline-none transition pr-12 placeholder-zinc-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                kg
              </span>
            </div>
          </div>

          {/* Target weight field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Ton objectif <span className="text-zinc-600 font-normal">(optionnel)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="500"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="Ex: 70"
                className="w-full bg-[#1f1f1f] border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-lg font-medium outline-none transition pr-12 placeholder-zinc-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                kg
              </span>
            </div>
            <p className="text-zinc-700 text-xs mt-1.5">
              Pas de pression, tu pourras changer ça plus tard 🙏
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !weight}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 mt-2"
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
              'C\'est parti ! 🚀'
            )}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={handleSkip}
            className="text-zinc-600 text-xs hover:text-zinc-400 transition text-center"
          >
            Passer pour l&apos;instant
          </button>
        </form>
      </div>
    </div>
  )
}
