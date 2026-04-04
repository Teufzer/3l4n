import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OnboardingModal from '@/components/OnboardingModal'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Fetch user goals + check onboarding
  const [user, weightCount] = await Promise.all([
    prisma.user.findUnique({
    where: { id: session.user!.id! },
      select: { targetWeight: true, startWeight: true },
    }),
    prisma.weightEntry.count({ where: { userId: session.user!.id! } }),
  ])

  const needsOnboarding = weightCount === 0

  return (
    <>
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="text-sm text-white/30 hover:text-white/70 transition"
              title="Paramètres"
            >
              ⚙️
            </Link>
            <Link
              href={`/profile/${session.user?.id}`}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              {session.user?.name || 'Mon profil'}
            </Link>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 mb-4">
          <p className="text-zinc-400 text-sm">Bienvenue,</p>
          <h2 className="text-xl font-semibold text-white mt-1">
            {session.user?.name || session.user?.email} 👋
          </h2>
          {user?.targetWeight && (
            <p className="text-xs text-emerald-500/70 mt-2">
              🎯 Objectif : {user.targetWeight} kg
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/feed"
            className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800 hover:border-emerald-500/30 transition group"
          >
            <p className="text-emerald-400 text-2xl mb-2">📣</p>
            <p className="text-white font-medium text-sm group-hover:text-emerald-400 transition">Feed</p>
            <p className="text-zinc-500 text-xs mt-1">Vois ce que la communauté partage</p>
          </Link>
          <Link
            href={`/profile/${session.user?.id}`}
            className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800 hover:border-emerald-500/30 transition group"
          >
            <p className="text-emerald-400 text-2xl mb-2">👤</p>
            <p className="text-white font-medium text-sm group-hover:text-emerald-400 transition">Profil</p>
            <p className="text-zinc-500 text-xs mt-1">Ton parcours et tes stats</p>
          </Link>
          <Link
            href="/settings"
            className="bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-800 hover:border-emerald-500/30 transition group col-span-2"
          >
            <p className="text-emerald-400 text-2xl mb-2">⚙️</p>
            <p className="text-white font-medium text-sm group-hover:text-emerald-400 transition">Paramètres</p>
            <p className="text-zinc-500 text-xs mt-1">
              {user?.targetWeight
                ? `Objectif : ${user.targetWeight} kg${user.startWeight ? ` · Départ : ${user.startWeight} kg` : ''}`
                : 'Définis ton objectif de poids'}
            </p>
          </Link>
        </div>
      </div>
    </div>

    {/* Onboarding modal — shown if user has no weight entries yet */}
    {needsOnboarding && (
      <OnboardingModal userName={session.user?.name} />
    )}
    </>
  )
}
