'use client'

import { useState } from 'react'

interface WeightFormProps {
  onSuccess?: (entry: { id: string; weight: number; date: string; note?: string | null }) => void
}

export default function WeightForm({ onSuccess }: WeightFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) {
      setError('Entre un poids valide.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: w, date, note: note || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erreur lors de l\'enregistrement.')
        return
      }

      const data = await res.json()
      setSuccess(true)
      setWeight('')
      setNote('')
      onSuccess?.(data.entry)

      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4"
    >
      <h2 className="text-white font-semibold text-base">Ajouter une pesée</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Poids */}
        <div className="space-y-1.5">
          <label className="block text-white/50 text-xs font-medium" htmlFor="weight">
            Poids (kg)
          </label>
          <div className="relative">
            <input
              id="weight"
              type="number"
              step="0.1"
              min="20"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
              required
              className="w-full bg-[#0f0f0f] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">kg</span>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-white/50 text-xs font-medium" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            required
            className="w-full bg-[#0f0f0f] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="block text-white/50 text-xs font-medium" htmlFor="note">
          Note (optionnel)
        </label>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Après sport, après repas…"
          maxLength={200}
          className="w-full bg-[#0f0f0f] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs font-medium">{error}</p>
      )}

      {/* Success */}
      {success && (
        <p className="text-emerald-400 text-xs font-medium">✓ Pesée enregistrée !</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl py-2.5 transition-colors active:scale-[0.99]"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
