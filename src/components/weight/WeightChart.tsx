'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

export interface WeightDataPoint {
  date: string   // ISO string
  weight: number
  note?: string | null
}

interface WeightChartProps {
  data: WeightDataPoint[]
  goal?: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function formatTooltipDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: WeightDataPoint }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white/50 text-xs mb-1">{formatTooltipDate(label ?? point.date)}</p>
      <p className="text-emerald-400 font-bold text-lg leading-none">
        {payload[0].value.toFixed(1)} <span className="text-white/40 text-sm font-normal">kg</span>
      </p>
      {point.note && (
        <p className="text-white/40 text-xs mt-1.5 max-w-[160px] truncate">{point.note}</p>
      )}
    </div>
  )
}

export default function WeightChart({ data, goal }: WeightChartProps) {
  if (!data.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] gap-2">
        <span className="text-3xl">📈</span>
        <p className="text-white/40 text-sm text-center">
          Ajoute ta première pesée pour voir ta courbe
        </p>
      </div>
    )
  }

  // Padding du domaine Y
  const weights = data.map((d) => d.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const padding = Math.max((maxW - minW) * 0.3, 2)
  const domainMin = Math.max(0, minW - padding)
  const domainMax = maxW + padding

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
      <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-4">
        Courbe de progression
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            width={45}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          {/* Ligne objectif */}
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="#10b981"
              strokeDasharray="5 4"
              strokeOpacity={0.5}
              label={{
                value: `Objectif ${goal} kg`,
                position: 'insideTopRight',
                fill: 'rgba(16,185,129,0.6)',
                fontSize: 10,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="weight"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#emeraldGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#10b981',
              stroke: '#0f0f0f',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
