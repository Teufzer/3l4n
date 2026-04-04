import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales — 3l4n',
  description: 'Mentions légales de la plateforme 3l4n.',
}

export default function MentionsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black text-white mb-2">
        Mentions Légales
      </h1>
      <p className="text-white/30 text-sm mb-10">Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN)</p>

      <Section title="Éditeur du site">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 not-prose space-y-2">
          <Row label="Nom" value="Killian D." />
          <Row label="Statut" value="Particulier — exploitant à titre personnel" />
          <Row label="Contact" value={<a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>} />
        </div>
      </Section>

      <Section title="Directeur de la publication">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 not-prose space-y-2">
          <Row label="Nom" value="Killian D." />
          <Row label="Contact" value={<a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>} />
        </div>
      </Section>

      <Section title="Hébergement">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 not-prose space-y-2">
          <Row label="Société" value="Hetzner Online GmbH" />
          <Row label="Adresse" value="Industriestr. 25, 91710 Gunzenhausen, Allemagne" />
          <Row label="Site web" value={<a href="https://www.hetzner.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">www.hetzner.com</a>} />
        </div>
        <p className="mt-4 text-sm">
          Les médias (images, photos de profil) sont hébergés sur <strong className="text-white">Cloudflare R2</strong> et
          distribués via le CDN <strong className="text-white">cdn.3l4n.com</strong>.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments constituant le site 3l4n (structure, design, logo, code source) sont
          la propriété exclusive de Killian D. Toute reproduction, représentation, modification ou
          exploitation non autorisée de ces éléments est strictement interdite.
        </p>
        <p>
          Les contenus publiés par les utilisateurs (posts, commentaires, photos) restent la propriété
          de leurs auteurs respectifs. En publiant du contenu sur 3l4n, les utilisateurs accordent à
          la plateforme une licence d&apos;affichage telle que définie dans les{' '}
          <a href="/legal/cgu" className="text-emerald-400 hover:underline">Conditions Générales d&apos;Utilisation</a>.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p>
          Le traitement des données personnelles des utilisateurs est décrit dans la{' '}
          <a href="/legal/privacy" className="text-emerald-400 hover:underline">Politique de Confidentialité</a>.
          Conformément au RGPD, vous pouvez exercer vos droits en contactant{' '}
          <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>.
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera
          soumis à la compétence exclusive des juridictions françaises.
        </p>
      </Section>

      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">
          Contact :{' '}
          <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>
        </p>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
        {title}
      </h2>
      <div className="text-zinc-300 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-white/40 w-32 shrink-0">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  )
}
