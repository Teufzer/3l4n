import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'
import OnboardingModal from '@/components/OnboardingModal'
import UsernameOnboardingModal from '@/components/UsernameOnboardingModal'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const [rawEntries, user, weightCount] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'asc' },
      select: { id: true, weight: true, date: true, note: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { targetWeight: true, startWeight: true, username: true, accounts: { select: { provider: true } } },
    }),
    prisma.weightEntry.count({ where: { userId: session.user.id } }),
  ])

  const entries = rawEntries.map((e) => ({
    id: e.id,
    weight: e.weight,
    date: e.date.toISOString(),
    note: e.note,
  }))

  const needsOnboarding = weightCount === 0
  const isGoogleUser = user?.accounts?.some((a) => a.provider === 'google') ?? false
  const needsUsername = isGoogleUser && !user?.username

  return (
    <>
      <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 pb-24">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/feed" className="text-2xl font-bold text-white hover:opacity-80 transition">
              3l<span className="text-emerald-500">4</span>n
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-zinc-500 hover:text-white transition" title="Paramètres">
                ⚙️
              </Link>
              <Link
                href={session.user.username ? `/${session.user.username}` : `/profile/${session.user.id}`}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/30" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                    {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Welcome */}
          <div>
            <h2 className="text-xl font-semibold text-white">
              Bonjour {session.user.name || session.user.email} 👋
            </h2>
          </div>

          {/* Dashboard client (stats + chart + form) */}
          <DashboardClient initialEntries={entries} targetWeight={user?.targetWeight ?? null} startWeight={user?.startWeight ?? null} />

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
            <span className="text-zinc-500 group-hover:text-emerald-400 transition text-lg">→</span>
          </Link>
        </div>
      </div>

      {needsUsername && <UsernameOnboardingModal userName={session.user?.name} />}
      {!needsUsername && needsOnboarding && <OnboardingModal userName={session.user?.name} />}
    </>
  )
}
