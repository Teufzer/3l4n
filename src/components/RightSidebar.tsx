import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function RightSidebar() {
  const session = await auth()

  // Top users par nombre de posts
  const topUsers = await prisma.user.findMany({
    where: { banned: false },
    orderBy: { posts: { _count: 'desc' } },
    take: 3,
    select: {
      id: true, name: true, username: true, image: true, avatar: true,
      _count: { select: { posts: true } }
    }
  }).catch(() => [])

  return (
    <div className="sticky top-4 flex flex-col gap-4">
      {/* Rejoindre si non connecté */}
      {!session && (
        <div className="bg-[#16181c] rounded-2xl p-4 border border-white/5">
          <h2 className="text-xl font-black text-white mb-1">Rejoins 3l4n</h2>
          <p className="text-white/50 text-sm mb-4 leading-relaxed">
            Suis ta progression, rejoins une communauté bienveillante.
          </p>
          <Link
            href="/register"
            className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full py-2.5 text-sm transition mb-2"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="block w-full text-center border border-white/10 hover:bg-white/5 text-white font-bold rounded-full py-2.5 text-sm transition"
          >
            Se connecter
          </Link>
        </div>
      )}

      {/* Membres actifs */}
      {topUsers.length > 0 && (
        <div className="bg-[#16181c] rounded-2xl p-4 border border-white/5">
          <h2 className="text-lg font-black text-white mb-3">Membres actifs</h2>
          <div className="flex flex-col gap-3">
            {topUsers.map((user) => {
              const href = user.username ? `/${user.username}` : `/profile/${user.id}`
              const avatar = user.image || user.avatar
              return (
                <Link key={user.id} href={href} className="flex items-center gap-3 hover:bg-white/5 rounded-xl p-1.5 transition -mx-1.5">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={user.name || ''} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                      {(user.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-white/40 text-xs truncate">
                      {user.username ? `@${user.username}` : ''} · {user._count.posts} posts
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-white/20 text-xs px-1">
        3l4n · <Link href="/feed" className="hover:underline">Feed</Link> · <Link href="/register" className="hover:underline">S&apos;inscrire</Link>
      </p>
    </div>
  )
}
