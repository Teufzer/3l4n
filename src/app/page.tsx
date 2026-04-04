import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden">

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            3l<span className="text-emerald-500">4</span>n
          </span>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">
            Se connecter →
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6 tracking-wide">
            🌱 100% gratuit · sans jugement
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Perdre du poids{' '}
            <span className="text-emerald-400">ensemble</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            Suis ta progression, partage tes victoires, trouve ta tribu.
            Sans honte, sans pression.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Rejoindre 3l4n ✨
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-medium text-base transition"
            >
              Déjà membre
            </Link>
          </div>
          <p className="text-zinc-600 text-xs mt-6">Rejoins des centaines de personnes sur le chemin 💚</p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10 text-white">Tout ce dont tu as besoin</h2>
          <div className="flex flex-col gap-4">

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">📊</div>
                <div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Suivi de ta courbe</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">Ajoute ton poids chaque jour. Regarde ta courbe descendre. Rien de plus motivant que de voir ses progrès en un coup d&apos;œil.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">👥</div>
                <div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Communauté bienveillante</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">Un feed rempli de gens qui vivent la même chose que toi. Partage, lis, encourage. Ici, personne ne te juge.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">💪</div>
                <div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Entraide quotidienne</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">Les mauvais jours arrivent. La communauté est là pour les tenir. Ensemble, on lâche moins facilement.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10 text-white">Ils l&apos;ont fait 🏆</h2>
          <div className="flex flex-col gap-4">

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">TS</div>
                <div>
                  <p className="font-medium text-white text-sm">TeufeurS</p>
                  <p className="text-zinc-600 text-xs">Membre depuis 8 mois</p>
                </div>
                <span className="ml-auto text-emerald-400 font-bold text-sm">−21 kg</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed italic">
                &ldquo;J&apos;avais essayé 100 applis avant 3l4n. La différence ? Ici les gens t&apos;encouragent vraiment. TeufeurS a perdu 21 kg avec 3l4n et c&apos;est la fierté de ma vie.&rdquo;
              </p>
              <p className="text-emerald-400 text-xs mt-3">★★★★★</p>
            </div>

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">ML</div>
                <div>
                  <p className="font-medium text-white text-sm">MarieLou</p>
                  <p className="text-zinc-600 text-xs">Membre depuis 5 mois</p>
                </div>
                <span className="ml-auto text-emerald-400 font-bold text-sm">−14 kg</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed italic">
                &ldquo;Le suivi de courbe m&apos;a carrément changé la vie. Voir les chiffres descendre semaine après semaine, c&apos;est plus addictif que les réseaux sociaux normaux 😂&rdquo;
              </p>
              <p className="text-emerald-400 text-xs mt-3">★★★★★</p>
            </div>

            <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">RK</div>
                <div>
                  <p className="font-medium text-white text-sm">Romain_K</p>
                  <p className="text-zinc-600 text-xs">Membre depuis 3 mois</p>
                </div>
                <span className="ml-auto text-emerald-400 font-bold text-sm">−8 kg</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed italic">
                &ldquo;Ce que j&apos;aime c&apos;est qu&apos;il n&apos;y a pas de régime miracle ni de coach qui te vend du rêve. Juste des vraies personnes, des vrais progrès.&rdquo;
              </p>
              <p className="text-emerald-400 text-xs mt-3">★★★★★</p>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl border border-emerald-500/20 p-10">
            <h2 className="text-3xl font-black mb-3">
              C&apos;est gratuit,<br />
              <span className="text-emerald-400">c&apos;est maintenant.</span>
            </h2>
            <p className="text-zinc-500 text-sm mb-8">Pas de carte bleue. Pas d&apos;abonnement. Juste toi et ta progression.</p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              Rejoindre 3l4n — c&apos;est gratuit ✨
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pb-8 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto pt-8 text-center">
          <p className="text-zinc-700 text-xs">3l<span className="text-emerald-700">4</span>n — Fait avec 💚 pour ceux qui avancent</p>
        </div>
      </footer>

    </div>
  )
}
