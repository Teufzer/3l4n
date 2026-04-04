'use client'

import { useState, useCallback } from 'react'
import WeightStats from '@/components/weight/WeightStats'
import WeightChart, { type WeightDataPoint } from '@/components/weight/WeightChart'
import WeightForm from '@/components/weight/WeightForm'

interface DashboardClientProps {
  initialEntries: WeightDataPoint[]
  targetWeight?: number | null
  startWeight?: number | null
  userImage?: string | null
}

export default function DashboardClient({ initialEntries, targetWeight, startWeight }: DashboardClientProps) {
  const [entries, setEntries] = useState<WeightDataPoint[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = useCallback(
    (entry: { id: string; weight: number; date: string; note?: string | null }) => {
      setEntries((prev) => {
        const updated = [
          ...prev,
          { date: entry.date, weight: entry.weight, note: entry.note },
        ]
        return updated.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      })
      setTimeout(() => setShowForm(false), 1500)
    },
    []
  )

  const hasData = entries.length > 0

  return (
    <div className="space-y-4">
      {/* Hero stats + CTA button */}
      <WeightStats
        data={entries}
        startWeight={startWeight ?? undefined}
        targetWeight={targetWeight ?? undefined}
        goal={targetWeight ?? undefined}
        onAddWeight={() => setShowForm(true)}
      />

      {/* Chart or empty state */}
      {hasData ? (
        <WeightChart data={entries} />
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
          <span className="text-5xl">💪</span>
          <div>
            <p className="text-white font-semibold text-base">Commence ici</p>
            <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
              Entre ton premier poids pour voir ta courbe de progression apparaître ici.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
          >
            Ajouter ma première pesée →
          </button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false)
          }}
        >
          <div className="w-full max-w-md space-y-3" style={{ animation: 'slideUp 0.25s ease-out' }}>
            <WeightForm onSuccess={handleSuccess} />
            <button
              onClick={() => setShowForm(false)}
              className="w-full text-zinc-500 hover:text-white text-sm py-2 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
