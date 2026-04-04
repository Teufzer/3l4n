import Link from 'next/link'
import { auth } from '@/auth'

interface StatsResponse {
  members: number
  posts: number
  kgLost: number
  kgGained: number
  weeklyTop: {
    username: string | null
    name: string
    userId: string
    delta: number
  }[]
}

async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(`${baseUrl}/api/stats`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

const medals = ['🥇', '🥈', '🥉']

export default async function RightSidebar() {
  const [session, stats] = await Promise.all([auth(), fetchStats()])
  const isConnected = !!session?.user

  return (
    <aside className="sticky top-4 flex flex-col gap-4 w-full">

      {/* ─── Stats globales ─── */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Stats 3l4n
        </p>
        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <span className="text-lg leading-none">👥</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                {stats ? formatNumber(stats.members) : '—'}
              </span>
              <span className="text-xs text-white/40">membres</span>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg leading-none">📝</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                {stats ? formatNumber(stats.posts) : '—'}
              </span>
              <span className="text-xs text-white/40">posts</span>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg leading-none">📉</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-emerald-400">
                {stats ? `${stats.kgLost.toFixed(1)} kg` : '—'}
              </span>
              <span className="text-xs text-white/40">perdus en tout</span>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg leading-none">📈</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-amber-400">
                {stats ? `${stats.kgGained.toFixed(1)} kg` : '—'}
              </span>
              <span className="text-xs text-white/40">pris en tout</span>
            </div>
          </li>
        </ul>
      </div>

      {/* ─── Top de la semaine ─── */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          🏆 Top cette semaine
        </p>
        {stats && stats.weeklyTop.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {stats.weeklyTop.map((entry, i) => (
              <li key={entry.userId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{medals[i]}</span>
                  <Link
                    href={`/profile/${entry.username ?? entry.userId}`}
                    className="truncate text-sm font-medium text-white hover:text-emerald-400 transition-colors"
                  >
                    @{entry.username ?? entry.name}
                  </Link>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    entry.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {entry.delta <= 0 ? '−' : '+'}
                  {Math.abs(entry.delta).toFixed(1)} kg
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/30 text-center py-2">
            Pas encore de données cette semaine
          </p>
        )}
      </div>

      {/* ─── Rejoindre 3l4n (si non connecté) ─── */}
      {!isConnected && (
        <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Rejoindre 3l4n
          </p>
          <p className="mb-4 text-xs text-white/60 leading-relaxed">
            Suis ton poids, partage tes progrès et motive-toi avec la communauté.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/register"
              className="block w-full rounded-xl bg-emerald-500 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-xl border border-white/10 py-2 text-center text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
