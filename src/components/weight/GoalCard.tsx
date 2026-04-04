'use client'

interface GoalCardProps {
  startWeight: number
  targetWeight: number
  currentWeight: number | null
}

export default function GoalCard({ startWeight, targetWeight, currentWeight }: GoalCardProps) {
  if (currentWeight === null) return null

  // Calcule le % de progression
  // Si l'objectif est de perdre du poids : startWeight > targetWeight
  // Si l'objectif est d'en prendre : startWeight < targetWeight
  const totalDelta = startWeight - targetWeight // positif si perte, négatif si gain
  const progressDelta = startWeight - currentWeight // positif si perte, négatif si gain

  let progressPct: number
  if (totalDelta === 0) {
    progressPct = 100
  } else {
    progressPct = Math.round((progressDelta / totalDelta) * 100)
    progressPct = Math.max(0, Math.min(100, progressPct))
  }

  const isLoss = totalDelta > 0
  const goalReached = progressPct >= 100

  // Badge motivant
  const badge =
    goalReached
      ? '🏆 Objectif atteint !'
      : progressPct >= 50
      ? '🔥 En feu'
      : '💪 Continue'

  const badgeColor =
    goalReached
      ? 'text-yellow-400 bg-yellow-400/10'
      : progressPct >= 50
      ? 'text-orange-400 bg-orange-400/10'
      : 'text-blue-400 bg-blue-400/10'

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🎯</span>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
            Objectif de poids
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Progress text */}
      <div>
        <p className="text-white font-bold text-lg leading-none">
          {goalReached
            ? `Félicitations 🎉`
            : `Tu as atteint ${progressPct}% de ton objectif`}
        </p>
        <p className="text-white/30 text-xs mt-1">
          {isLoss
            ? `${currentWeight.toFixed(1)} kg → objectif ${targetWeight} kg`
            : `${currentWeight.toFixed(1)} kg → objectif ${targetWeight} kg`}
          {!goalReached && ` (${Math.abs(currentWeight - targetWeight).toFixed(1)} kg restant${isLoss ? ' à perdre' : ' à prendre'})`}
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/30 mb-1.5">
          <span>{startWeight} kg</span>
          <span>{targetWeight} kg</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: goalReached
                ? 'linear-gradient(90deg, #10b981, #fbbf24)'
                : progressPct >= 50
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : '#10b981',
            }}
          />
        </div>
        <p className="text-right text-xs text-emerald-400 mt-1 font-semibold">
          {progressPct}%
        </p>
      </div>
    </div>
  )
}
