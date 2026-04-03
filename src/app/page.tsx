import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-sm mx-auto">
        <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
          3l<span className="text-emerald-500">4</span>n
        </h1>
        <p className="text-zinc-400 text-lg mb-2">
          Ton parcours. Ta progression. Ta communauté.
        </p>
        <p className="text-zinc-600 text-sm mb-10">
          Réseau social de suivi de poids bienveillant.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition"
          >
            Commencer maintenant
          </Link>
          <Link
            href="/login"
            className="w-full py-3.5 px-6 rounded-xl bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-medium text-sm transition"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-2xl mb-1">📈</p>
            <p className="text-xs text-zinc-400">Suivi du poids</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-2xl mb-1">💚</p>
            <p className="text-xs text-zinc-400">Bienveillance</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-zinc-800">
            <p className="text-2xl mb-1">👥</p>
            <p className="text-xs text-zinc-400">Communauté</p>
          </div>
        </div>
      </div>
    </div>
  )
}
