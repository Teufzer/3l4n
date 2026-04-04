import { auth } from '@/auth'
import Link from 'next/link'
import Feed from '@/components/feed/Feed'
import Logo from '@/components/Logo'
import { isR2Configured } from '@/lib/r2'

export default async function FeedPage() {
  const session = await auth()
  const r2Enabled = isR2Configured()

  const profileHref = session?.user
    ? (session.user.username ? `/${session.user.username}` : `/profile/${session.user.id}`)
    : '/login'

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Logo href="/feed" size="md" />
          {session?.user ? (
            <Link
              href={profileHref}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
            >
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/30" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-1 ring-emerald-500/30">
                  {(session.user?.name ?? 'M').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <span className="hidden sm:block">{session.user?.name}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Feed */}
      <Feed r2Enabled={r2Enabled} userImage={session?.user?.image ?? undefined} userName={session?.user?.name ?? undefined} />
    </div>
  )
}
