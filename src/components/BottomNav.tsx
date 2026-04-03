'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', emoji: '🏠' },
  { href: '/feed', label: 'Feed', emoji: '👥' },
  { href: '/profil', label: 'Profil', emoji: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-white/5 safe-bottom">
      <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-4">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all
                ${isActive
                  ? 'text-emerald-400'
                  : 'text-white/40 hover:text-white/70'
                }`}
            >
              <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                {emoji}
              </span>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-emerald-400' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
