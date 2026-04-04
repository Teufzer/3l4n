import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()
  if (session) redirect('/feed')

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-black tracking-tight">
          3l<span className="text-emerald-400">4</span>n
        </span>
        <Link
          href="/login"
          className="text-sm text-white/60 hover:text-white transition"
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Réseau social de suivi de poids
          </div>

          {/* Titre */}
          <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
            Perdre du poids,{' '}
            <span className="text-emerald-400">ensemble</span>.
          </h1>

          {/* Sous-titre */}
          <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-md mx-auto">
            Suis ta progression, partage tes victoires, trouve du soutien.
            Sans jugement.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-base transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/feed"
              className="w-full sm:w-auto px-8 py-3.5 border border-white/10 hover:bg-white/5 text-white font-medium rounded-full text-base transition"
            >
              Voir la communauté
            </Link>
          </div>
        </div>
      </main>

      {/* Stats en bas */}
      <footer className="px-6 pb-10 pt-16 flex justify-center gap-12 text-center">
        {[
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: 'Jugement' },
          { value: '∞', label: 'Soutien' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-black text-emerald-400">{s.value}</p>
            <p className="text-white/30 text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </footer>

    </div>
  )
}
