import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm mx-auto">
        {/* Big number */}
        <p className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-900 select-none">
          404
        </p>

        <h1 className="text-2xl font-bold text-white mt-2 mb-3">
          Cette page n&apos;existe pas
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          Tu t&apos;es perdu en chemin ? Pas de panique, ça arrive aux meilleurs.
          Retourne sur la bonne route 👇
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            Retour au dashboard
          </Link>
          <Link
            href="/"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-600 text-zinc-400 font-medium text-sm transition"
          >
            Page d&apos;accueil
          </Link>
        </div>

        <p className="text-zinc-800 text-xs mt-10">
          3l<span className="text-emerald-900">4</span>n
        </p>
      </div>
    </div>
  )
}
