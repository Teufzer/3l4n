'use client'

import GoalCard from './GoalCard'
import type { WeightDataPoint } from './WeightChart'

interface WeightStatsProps {
  data: WeightDataPoint[]
  goal?: number
  startWeight?: number
  targetWeight?: number
}

/**
 * Calcule le streak : nombre de jours consécutifs avec une pesée (jusqu'à aujourd'hui).
 */
function computeStreak(data: WeightDataPoint[]): number {
  if (!data.length) return 0

  // Déduplique par jour (YYYY-MM-DD)
  const days = Array.from(
    new Set(data.map((d) => d.date.slice(0, 10)))
  ).sort()

  if (!days.length) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Le streak doit inclure aujourd'hui ou hier
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

interface StatCardProps {
  label: string
  value: string | null
  sub?: string
  accent?: 'emerald' | 'red' | 'neutral'
  icon?: string
}

function StatCard({ label, value, sub, accent = 'neutral', icon }: StatCardProps) {
  const textColor =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'red'
      ? 'text-red-400'
      : 'text-white'

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-base leading-none">{icon}</span>}
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider truncate">{label}</p>
      </div>
      <p className={`text-xl font-bold leading-none truncate ${textColor}`}>
        {value ?? <span className="text-white/20">—</span>}
      </p>
      {sub && <p className="text-white/30 text-xs mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

export default function WeightStats({ data, goal, startWeight, targetWeight }: WeightStatsProps) {
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

  const goalDelta =
    current !== null && goal != null
      ? parseFloat((current - goal).toFixed(1))
      : null

  const goalSub =
    goalDelta !== null
      ? goalDelta > 0
        ? `${goalDelta} kg à perdre`
        : goalDelta < 0
        ? `${Math.abs(goalDelta)} kg sous l'objectif 🎉`
        : 'Objectif atteint ! 🎯'
      : undefined

  const streak = computeStreak(data)

  // Calcule la progression vers l'objectif (pour le badge motivant)
  const effectiveStart = startWeight ?? first ?? null
  const goalProgress =
    current !== null && targetWeight != null && effectiveStart !== null
      ? (() => {
          const totalDelta = effectiveStart - targetWeight
          const progressDelta = effectiveStart - current
          if (totalDelta === 0) return 100
          const pct = Math.round((progressDelta / totalDelta) * 100)
          return Math.max(0, Math.min(100, pct))
        })()
      : null

  // Badge motivant selon la progression
  const motivationBadge =
    goalProgress !== null
      ? goalProgress >= 100
        ? { label: '🏆 Objectif atteint !', color: 'text-yellow-400 bg-yellow-400/10' }
        : goalProgress >= 50
        ? { label: '🔥 En feu', color: 'text-orange-400 bg-orange-400/10' }
        : { label: '💪 Continue', color: 'text-blue-400 bg-blue-400/10' }
      : null

  return (
    <div className="flex flex-col gap-3">
      {/* Grille de stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Poids actuel"
          value={current !== null ? `${current.toFixed(1)} kg` : null}
          sub={data.length ? `Dernière pesée` : 'Aucune pesée'}
          icon="⚖️"
        />
        <StatCard
          label="Objectif"
          value={goal != null ? `${goal} kg` : null}
          sub={goalSub}
          accent={goalDelta !== null && goalDelta <= 0 ? 'emerald' : 'neutral'}
          icon="🎯"
        />
        <StatCard
          label="Évolution"
          value={deltaStr}
          sub={data.length > 1 ? `depuis le départ` : 'Pas encore assez de données'}
          accent={delta !== null ? (delta < 0 ? 'emerald' : delta > 0 ? 'red' : 'neutral') : 'neutral'}
          icon="📉"
        />
        <StatCard
          label="Streak"
          value={streak > 0 ? `${streak} jour${streak > 1 ? 's' : ''}` : null}
          sub={streak > 0 ? '🔥 continue comme ça !' : "Pèse-toi aujourd'hui"}
          accent={streak >= 3 ? 'emerald' : 'neutral'}
          icon="🗓️"
        />
      </div>

      {/* Badge motivant + mini barre de progression */}
      {goalProgress !== null && motivationBadge && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <span className="text-xs text-white/40 tabular-nums shrink-0">{goalProgress}%</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${motivationBadge.color}`}>
            {motivationBadge.label}
          </span>
        </div>
      )}

      {/* GoalCard détaillée si objectif et poids de départ définis */}
      {targetWeight != null && effectiveStart !== null && (
        <GoalCard
          startWeight={effectiveStart}
          targetWeight={targetWeight}
          currentWeight={current}
        />
      )}
    </div>
  )
}
