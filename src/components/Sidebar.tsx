'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const navItems = [
  {
    href: '/feed', label: 'Accueil',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  },
  {
    href: '/notifications', label: 'Notifications',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  },
  {
    href: '/dashboard', label: 'Dashboard',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  {
    href: '/settings', label: 'Paramètres',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as { id?: string; name?: string; image?: string; username?: string } | undefined

  const profileHref = user?.username ? `/${user.username}` : user?.id ? `/profile/${user.id}` : '/login'

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[275px] xl:w-[320px] border-r border-white/5 px-4 xl:px-6 py-4 z-40">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2 px-3 py-3 mb-2 group w-fit rounded-2xl hover:bg-white/5 transition">
        <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
        <span className="text-xl font-black text-white tracking-tight">
          3l<span className="text-emerald-400">4</span>n
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all text-[17px]
                ${active
                  ? 'font-bold text-white'
                  : 'font-normal text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className={active ? 'text-white' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Profil */}
        <Link
          href={profileHref}
          className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all text-[17px]
            ${pathname.startsWith('/profile') || (user?.username && pathname === `/${user.username}`)
              ? 'font-bold text-white'
              : 'font-normal text-white/70 hover:text-white hover:bg-white/5'
            }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Profil</span>
        </Link>

        {/* Bouton Publier */}
        <Link
          href="/feed"
          className="mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[15px] rounded-full py-3.5 px-6 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          Publier
        </Link>
      </nav>

      {/* User info en bas */}
      {user && (
        <Link href={profileHref} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition mt-2">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold truncate">{user.name}</p>
            <p className="text-white/40 text-xs truncate">@{user.username || 'user'}</p>
          </div>
        </Link>
      )}
    </aside>
  )
}
