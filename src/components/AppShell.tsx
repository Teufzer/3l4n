'use client'

import { usePathname } from 'next/navigation'

const PUBLIC_ROUTES = ['/', '/login', '/register']
const FULL_WIDTH_PREFIXES = ['/admin', '/legal']

export default function AppShell({ children, sidebar, rightSidebar, bottomNav }: {
  children: React.ReactNode
  sidebar: React.ReactNode
  rightSidebar: React.ReactNode
  bottomNav: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.includes(pathname) || FULL_WIDTH_PREFIXES.some(p => pathname.startsWith(p))

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-[1280px] flex relative">
        {/* Sidebar gauche */}
        <div className="hidden lg:flex flex-col w-[275px] xl:w-[320px] shrink-0">
          <div className="fixed top-0 h-full w-[275px] xl:w-[320px] flex flex-col">
            {sidebar}
          </div>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0 border-x border-white/5 min-h-screen">
          {children}
        </main>

        {/* Sidebar droite */}
        <div className="hidden xl:flex flex-col w-[380px] shrink-0">
          <div className="fixed top-0 w-[380px] h-full overflow-y-auto px-6 py-4">
            {rightSidebar}
          </div>
        </div>
      </div>

      {/* Bottom nav mobile */}
      <div className="lg:hidden">
        {bottomNav}
      </div>
    </div>
  )
}
