import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Feed from '@/components/feed/Feed'
import { isR2Configured } from '@/lib/r2'

export default async function FeedPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const r2Enabled = isR2Configured()

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <Link
            href={`/profile/${session.user?.id}`}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-1 ring-emerald-500/30">
              {(session.user?.name ?? 'M')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <span className="hidden sm:block">{session.user?.name}</span>
          </Link>
        </div>
      </header>

      {/* Feed */}
      <Feed r2Enabled={r2Enabled} />
    </div>
  )
}
