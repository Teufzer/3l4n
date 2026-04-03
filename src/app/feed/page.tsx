import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FeedPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            3l<span className="text-emerald-500">4</span>n
          </h1>
          <Link
            href={`/profile/${session.user?.id}`}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            {session.user?.name}
          </Link>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-800 text-center">
          <p className="text-zinc-400 text-sm">Le feed arrive bientôt 🌱</p>
          <p className="text-zinc-600 text-xs mt-2">
            Cette section est en cours de construction.
          </p>
        </div>
      </div>
    </div>
  )
}
