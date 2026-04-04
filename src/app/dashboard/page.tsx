import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch weight entries server-side
  const rawEntries = await prisma.weightEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      weight: true,
      date: true,
      note: true,
    },
  })

  // Serialize dates to ISO strings for client components
  const entries = rawEntries.map((e) => ({
    id: e.id,
    weight: e.weight,
    date: e.date.toISOString(),
    note: e.note,
  }))

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <Link
            href={`/profile/${session.user.id}`}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs">
              {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
            </span>
            <span className="hidden sm:block">{session.user.name || 'Mon profil'}</span>
          </Link>
        </div>

        {/* Welcome */}
        <div>
          <p className="text-zinc-400 text-sm">Bienvenue,</p>
          <h2 className="text-xl font-semibold text-white mt-0.5">
            {session.user.name || session.user.email} 👋
          </h2>
        </div>

        {/* Dashboard client (stats + chart + form) */}
        <DashboardClient initialEntries={entries} />

        {/* Feed link */}
        <Link
          href="/feed"
          className="flex items-center justify-between bg-[#1a1a1a] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📣</span>
            <div>
              <p className="text-white font-medium text-sm group-hover:text-emerald-400 transition">
                Voir le feed
              </p>
              <p className="text-zinc-500 text-xs">Vois ce que la communauté partage</p>
            </div>
          </div>
          <span className="text-zinc-600 group-hover:text-emerald-500 transition">→</span>
        </Link>
      </div>
    </div>
  )
}
