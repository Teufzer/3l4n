'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  profileHref?: string
}

const getNavItems = (profileHref: string) => [
  {
    href: '/dashboard',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-6 h-6 transition-all ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        aria-hidden="true"
      >
        {active ? (
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        )}
      </svg>
    ),
  },
  {
    href: '/feed',
    label: 'Feed',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-6 h-6 transition-all ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        aria-hidden="true"
      >
        {active ? (
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 003 0V9a5 5 0 00-5-5h-1v3z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        )}
      </svg>
    ),
  },
  {
    href: profileHref,
    label: 'Profil',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-6 h-6 transition-all ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        aria-hidden="true"
      >
        {active ? (
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        )}
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Paramètres',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-6 h-6 transition-all ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        aria-hidden="true"
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        )}
      </svg>
    ),
  },
]

export default function BottomNav({ profileHref = '/profile' }: BottomNavProps) {
  const pathname = usePathname()

  // Hide on public pages
  const publicPaths = ['/', '/login', '/register']
  if (publicPaths.includes(pathname)) return null

  const navItems = getNavItems(profileHref)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/5">
      <div
        className="max-w-xl mx-auto flex items-center justify-around h-16 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ href, label, icon }) => {
          const isProfileActive = label === 'Profil' && (
            pathname.startsWith('/profile') || pathname === href
          )
          const active = label === 'Profil'
            ? isProfileActive
            : pathname === href || (href !== '/dashboard' && href !== '/settings' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200
                ${active
                  ? 'text-emerald-400'
                  : 'text-white/35 hover:text-white/60 active:scale-95'
                }`}
            >
              {icon(active)}
              <span className={`text-[10px] font-medium tracking-wide leading-none transition-colors ${active ? 'text-emerald-400' : 'text-white/35'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
