import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Admin nav bar */}
      <nav className="border-b border-white/10 bg-[#111] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="text-emerald-400 font-bold text-sm tracking-wide uppercase">
            ⚙ Admin
          </span>
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/reports"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Signalements
            </Link>
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Utilisateurs
            </Link>
          </div>
          <div className="ml-auto">
            <Link
              href="/feed"
              className="px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
