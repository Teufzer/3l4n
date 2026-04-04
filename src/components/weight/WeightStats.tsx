'use client'

import type { WeightDataPoint } from './WeightChart'

interface WeightStatsProps {
  data: WeightDataPoint[]
  goal?: number
  startWeight?: number
  targetWeight?: number
  onAddWeight?: () => void
}

/**
 * Calcule le streak : nombre de jours consécutifs avec une pesée (jusqu'à aujourd'hui).
 */
function computeStreak(data: WeightDataPoint[]): number {
  if (!data.length) return 0

  const days = Array.from(
    new Set(data.map((d) => d.date.slice(0, 10)))
  ).sort()

  if (!days.length) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const lastDay = days[days.length - 1]
  if (lastDay !== today && lastDay !== yesterday) return 0

  let streak = 1
  for (let i = days.length - 1; i > 0; i--) {
    const curr = new Date(days[i])
    const prev = new Date(days[i - 1])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export default function WeightStats({ data, goal, startWeight, targetWeight, onAddWeight }: WeightStatsProps) {
  const current = data.length ? data[data.length - 1].weight : null
  const first = data.length > 1 ? data[0].weight : null

  const effectiveFirst = startWeight ?? first
  const delta =
    current !== null && effectiveFirst !== null
      ? parseFloat((current - effectiveFirst).toFixed(1))
      : null

  const deltaStr =
    delta !== null
      ? delta < 0
        ? `−${Math.abs(delta)} kg`
        : delta > 0
        ? `+${delta} kg`
        : `= 0 kg`
      : null

  const streak = computeStreak(data)

  const effectiveTarget = targetWeight ?? goal ?? null

  // Calcule la progression vers l'objectif
  const effectiveStart = startWeight ?? first ?? null
  const goalProgress =
    current !== null && effectiveTarget !== null && effectiveStart !== null
      ? (() => {
          const totalDelta = effectiveStart - effectiveTarget
          const progressDelta = effectiveStart - current
          if (totalDelta === 0) return 100
          const pct = Math.round((progressDelta / totalDelta) * 100)
          return Math.max(0, Math.min(100, pct))
        })()
      : null

  const isGain = delta !== null && delta > 0
  const isLoss = delta !== null && delta < 0

  return (
    <div className="flex flex-col gap-3">
      {/* ── HERO CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5">
        {/* Subtle glow blob */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Top row: current weight + delta */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-white/40 mb-1">Poids actuel</p>
            <p className="text-5xl font-black text-white leading-none overflow-visible">
              {current !== null ? `${current.toFixed(1)} kg` : '—'}
            </p>
          </div>

          {deltaStr && (
            <div className={`shrink-0 text-right mt-1 ${isLoss ? 'text-emerald-400' : isGain ? 'text-red-400' : 'text-white/40'}`}>
              <p className="text-2xl font-bold leading-none">{deltaStr}</p>
              <p className="text-xs text-white/30 mt-1">
                depuis {effectiveFirst ? `${effectiveFirst} kg` : 'le départ'}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {goalProgress !== null && effectiveTarget !== null && (
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <span className="text-xs text-white/40 tabular-nums shrink-0">{goalProgress}%</span>
              <span className="text-xs text-white/30 shrink-0">🎯 {effectiveTarget} kg</span>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD BUTTON ── */}
      {onAddWeight && (
        <button
          onClick={onAddWeight}
          className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-semibold text-sm rounded-2xl py-3.5 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          <span className="text-xl font-bold leading-none">+</span>
          <span>Ajouter mon poids aujourd&apos;hui</span>
        </button>
      )}

      {/* ── SECONDARY STATS ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Évolution */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-w-0">
          <p className="text-white/40 text-xs">Évolution</p>
          <p className={`text-2xl font-bold leading-none ${isLoss ? 'text-emerald-400' : isGain ? 'text-red-400' : 'text-white/30'}`}>
            {deltaStr ?? '—'}
          </p>
          <p className="text-white/25 text-xs mt-0.5">depuis le départ</p>
        </div>

        {/* Streak */}
        <div className={`rounded-2xl p-4 flex flex-col gap-1 min-w-0 border ${
          streak > 0
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-[#1a1a1a] border-white/5'
        }`}>
          <p className="text-white/40 text-xs">Streak</p>
          <div className="flex items-center gap-1.5">
            {streak > 0 ? (
              <span className="text-xl" style={{ animation: 'pulse 2s infinite' }}>🔥</span>
            ) : (
              <span className="text-xl opacity-30">🔥</span>
            )}
            <p className={`text-2xl font-bold leading-none ${streak > 0 ? 'text-amber-400' : 'text-white/30'}`}>
              {streak > 0 ? `${streak}j` : '—'}
            </p>
          </div>
          <p className="text-white/25 text-xs mt-0.5">
            {streak > 0 ? 'continue comme ça !' : "Pèse-toi aujourd'hui"}
          </p>
        </div>
      </div>
    </div>
  )
}
