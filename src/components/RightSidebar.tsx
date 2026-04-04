'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Stats {
  members: number
  posts: number
  kgLost: number
  kgGained: number
  weeklyTop: { username: string | null; name: string; userId: string; delta: number }[]
}

const MEDALS = ['🥇', '🥈', '🥉']

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

export default function RightSidebar() {
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats | null>(null)

  const PUBLIC = ['/', '/login', '/register']
  if (PUBLIC.includes(pathname)) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (!stats) return (
    <div className="sticky top-4 space-y-4 animate-pulse">
      <div className="bg-[#1a1a1a] rounded-2xl h-40 border border-white/5" />
      <div className="bg-[#1a1a1a] rounded-2xl h-32 border border-white/5" />
    </div>
  )

  return (
    <div className="sticky top-4 space-y-4">
      {/* Stats globales */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Stats 3l4n</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">👥 Membres</span>
            <span className="text-white font-bold text-sm">{fmt(stats.members)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">📝 Posts</span>
            <span className="text-white font-bold text-sm">{fmt(stats.posts)}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">📉 Kg perdus</span>
            <span className="text-emerald-400 font-bold text-sm">{stats.kgLost.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">📈 Kg pris</span>
            <span className="text-amber-400 font-bold text-sm">{stats.kgGained.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Top semaine */}
      {stats.weeklyTop.length > 0 && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">🏆 Top cette semaine</p>
          <div className="space-y-3">
            {stats.weeklyTop.map((u, i) => {
              const href = u.username ? `/${u.username}` : `/profile/${u.userId}`
              const isLoss = u.delta < 0
              return (
                <Link key={u.userId} href={href} className="flex items-center gap-3 hover:bg-white/5 rounded-xl p-1.5 -mx-1.5 transition">
                  <span className="text-lg">{MEDALS[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{u.name}</p>
                    {u.username && <p className="text-white/30 text-xs">@{u.username}</p>}
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${isLoss ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isLoss ? '−' : '+'}{Math.abs(u.delta).toFixed(1)} kg
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-white/20 text-xs px-1">
        3l4n · <Link href="/feed" className="hover:underline">Feed</Link>
      </p>

      <div className="flex items-center gap-2 px-1 flex-wrap">
        <Link href="/legal/cgu" className="text-white/20 hover:text-white/40 text-xs transition">CGU</Link>
        <span className="text-white/10 text-xs">·</span>
        <Link href="/legal/privacy" className="text-white/20 hover:text-white/40 text-xs transition">Confidentialité</Link>
        <span className="text-white/10 text-xs">·</span>
        <Link href="/legal/mentions" className="text-white/20 hover:text-white/40 text-xs transition">Mentions légales</Link>
      </div>
    </div>
  )
}
