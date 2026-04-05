import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3l4n — Fermeture du service',
  description: 'Fermeture définitive de 3l4n.',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-black mb-2">
          3l<span className="text-emerald-400">4</span>n
        </h1>
        <div className="h-px bg-white/10 mb-8" />

        <h2 className="text-2xl font-bold mb-6 text-white">
          Fermeture du service
        </h2>

        <div className="space-y-4 text-white/70 leading-relaxed">
          <p>
            J&apos;ai pris la décision de fermer définitivement 3l4n.
          </p>
          <p>
            Ce projet a été construit avec l&apos;IA, sans expertise technique en sécurité de ma part. Suite à un audit indépendant, j&apos;ai réalisé que gérer un service qui collecte des données personnelles et de santé — emails, poids, progressions — représente une responsabilité que je ne suis pas en mesure d&apos;assumer correctement.
          </p>
          <p>
            On vit à une époque où les fuites de données sont de plus en plus fréquentes. Des milliers de Français voient leurs données personnelles compromises chaque semaine (voir{' '}
            <a
              href="https://frenchbreaches.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              frenchbreaches.com
            </a>
            ). Je refuse de contribuer à ça et de mettre en danger les informations que vous m&apos;avez confiées.
          </p>
          <p className="text-white font-semibold">
            Toutes vos données ont été supprimées.
          </p>
          <p>
            Ce n&apos;est pas un échec — c&apos;est une décision responsable. Merci à tous ceux qui ont participé à cette aventure. J&apos;ai appris énormément.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-white/40 text-sm">
          — Killian
        </div>
      </div>
    </div>
  )
}
