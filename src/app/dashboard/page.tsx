'use client'

import { useEffect, useState, useCallback } from 'react'
import WeightForm from '@/components/weight/WeightForm'
import WeightChart, { WeightDataPoint } from '@/components/weight/WeightChart'
import WeightStats from '@/components/weight/WeightStats'

// Objectif de poids (à terme, récupéré depuis le profil utilisateur)
const WEIGHT_GOAL = 70

export default function DashboardPage() {
  const [entries, setEntries] = useState<WeightDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/weight')
      if (!res.ok) {
        if (res.status === 401) {
          setError('Non authentifié. Connecte-toi pour voir tes données.')
          return
        }
        throw new Error('Erreur lors du chargement')
      }
      const data = await res.json()
      setEntries(
        data.entries.map((e: { id: string; weight: number; date: string; note?: string | null }) => ({
          date: e.date,
          weight: e.weight,
          note: e.note,
        }))
      )
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleNewEntry = (entry: { id: string; weight: number; date: string; note?: string | null }) => {
    setEntries((prev) => {
      const updated = [
        ...prev,
        { date: entry.date, weight: entry.weight, note: entry.note },
      ]
      // Trie par date
      return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg leading-none">3l4n</h1>
            <p className="text-white/40 text-xs mt-0.5">Tableau de bord</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 text-sm">👤</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-5">
            {/* Skeleton stats */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 h-[80px] animate-pulse"
                />
              ))}
            </div>
            {/* Skeleton chart */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl h-[260px] animate-pulse" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <WeightStats data={entries} goal={WEIGHT_GOAL} />

            {/* Courbe */}
            <WeightChart data={entries} goal={WEIGHT_GOAL} />
          </>
        )}

        {/* Formulaire — toujours visible */}
        <WeightForm onSuccess={handleNewEntry} />

        {/* Historique récent */}
        {!loading && entries.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider px-1">
              Historique récent
            </h2>
            <div className="space-y-2">
              {[...entries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((entry, i) => (
                  <div
                    key={i}
                    className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs">
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      {entry.note && (
                        <p className="text-white/30 text-xs truncate mt-0.5">{entry.note}</p>
                      )}
                    </div>
                    <span className="text-emerald-400 font-semibold text-sm flex-shrink-0">
                      {entry.weight.toFixed(1)} kg
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
