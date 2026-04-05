'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import VerifiedBadge from '@/components/VerifiedBadge'

const navItems = [
  {
    href: '/feed', label: 'Accueil',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  },
  {
    href: '/search', label: 'Rechercher',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
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
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user as { id?: string; name?: string; image?: string; username?: string; verified?: boolean } | undefined



  const [notifCount, setNotifCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/notifications/count')
        .then(r => r.json())
        .then(d => setNotifCount(d.count ?? 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Reset badge quand on visite la page notifications
  useEffect(() => {
    if (pathname === '/notifications') setNotifCount(0)
  }, [pathname])

  const profileHref = user?.username ? `/${user.username}` : user?.id ? `/profile/${user.id}` : '/login'

  const [searchValue, setSearchValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        router.push(`/search?q=${encodeURIComponent(val.trim())}`)
      } else {
        router.push('/search')
      }
    }, 300)
  }

  const handleSearchFocus = () => {
    if (!searchValue.trim()) {
      router.push('/search')
    }
  }

  return (
    <aside className="flex flex-col h-full w-full px-4 xl:px-6 py-4">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2 px-3 py-3 mb-2 group w-fit rounded-2xl hover:bg-white/5 transition">
        <span className="text-2xl font-black text-white tracking-tight">
          3l<span className="text-emerald-400">4</span>n
        </span>
      </Link>

      {/* Search bar */}
      <div className="relative mb-3 px-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="search"
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          placeholder="Rechercher..."
          className="w-full bg-white/5 rounded-full pl-9 pr-4 py-2 text-sm text-white/60 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:text-white transition"
        />
      </div>

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
              {item.href === '/notifications' && notifCount > 0 && (
                <span className="ml-auto bg-emerald-500 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
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

      {/* User info en bas — menu style Twitter */}
      {user && (
        <div className="relative mt-2">
          {/* Menu popup */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
              <Link href={profileHref} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-sm text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mon profil
              </Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-sm text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres
              </Link>
              <div className="h-px bg-white/5 mx-3" />
              <button onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-sm text-red-400 text-left">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
          
          {/* User card cliquable */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition">
          {(user.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-white text-sm font-bold truncate">{user.name}</p>
              {(user as { verified?: boolean }).verified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
            </div>
            <p className="text-white/40 text-xs truncate">@{user.username || 'user'}</p>
          </div>
          </button>
        </div>
      )}
    </aside>
  )
}
