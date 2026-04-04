import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [userCount, postCount, unresolvedReports, bannedCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.report.count({ where: { resolved: false } }),
    prisma.user.count({ where: { banned: true } }),
  ])

  const stats = [
    {
      label: 'Utilisateurs',
      value: userCount,
      icon: '👥',
      href: '/admin/users',
      color: 'emerald',
    },
    {
      label: 'Posts',
      value: postCount,
      icon: '📝',
      href: null,
      color: 'blue',
    },
    {
      label: 'Signalements non résolus',
      value: unresolvedReports,
      icon: '⚑',
      href: '/admin/reports',
      color: unresolvedReports > 0 ? 'red' : 'emerald',
    },
    {
      label: 'Comptes bannis',
      value: bannedCount,
      icon: '🚫',
      href: '/admin/users',
      color: 'orange',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colorMap: Record<string, string> = {
            emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            red: 'text-red-400 bg-red-500/10 border-red-500/20',
            orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
          }
          const cardClass = `border rounded-2xl p-5 ${colorMap[stat.color] || colorMap.emerald}`

          const card = (
            <div className={cardClass}>
              <div className="text-2xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm opacity-70">{stat.label}</div>
            </div>
          )

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="hover:opacity-80 transition-opacity">
              {card}
            </Link>
          ) : (
            <div key={stat.label}>{card}</div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/reports"
          className="group border border-white/10 hover:border-emerald-500/30 bg-[#1a1a1a] rounded-2xl p-5 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">⚑</span>
            <h2 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Gérer les signalements
            </h2>
          </div>
          <p className="text-white/40 text-sm">
            Examiner les contenus signalés, supprimer ou ignorer.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="group border border-white/10 hover:border-emerald-500/30 bg-[#1a1a1a] rounded-2xl p-5 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👥</span>
            <h2 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Gérer les utilisateurs
            </h2>
          </div>
          <p className="text-white/40 text-sm">
            Voir tous les membres, bannir ou débannir des comptes.
          </p>
        </Link>
      </div>
    </div>
  )
}
