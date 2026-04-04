import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — 3l4n',
  description: 'Politique de confidentialité et traitement des données personnelles (RGPD) de 3l4n.',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black text-white mb-2">
        Politique de Confidentialité
      </h1>
      <p className="text-white/30 text-sm mb-10">Dernière mise à jour : avril 2025</p>

      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées via la plateforme 3l4n est :
        </p>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 not-prose">
          <p className="text-white font-semibold">Killian D.</p>
          <p className="text-zinc-400 text-sm mt-1">Particulier — exploitant à titre personnel</p>
          <p className="text-zinc-400 text-sm">
            Contact :{' '}
            <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">
              contact@3l4n.com
            </a>
          </p>
        </div>
      </Section>

      <Section title="2. Données collectées">
        <p>Dans le cadre du fonctionnement de 3l4n, les données suivantes sont collectées :</p>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">2.1 Données de compte</h3>
        <ul className="text-zinc-300 space-y-1">
          <li><strong className="text-white">Adresse email</strong> — utilisée pour l&apos;authentification et les notifications</li>
          <li><strong className="text-white">Pseudo (username)</strong> — public, visible par tous les membres</li>
          <li><strong className="text-white">Nom d&apos;affichage</strong> — public, visible sur votre profil</li>
          <li><strong className="text-white">Mot de passe</strong> — stocké sous forme hashée (bcrypt), jamais en clair</li>
          <li><strong className="text-white">Photo de profil</strong> — optionnelle, stockée sur Cloudflare R2 (CDN : cdn.3l4n.com)</li>
        </ul>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">2.2 Données de suivi</h3>
        <ul className="text-zinc-300 space-y-1">
          <li><strong className="text-white">Données de poids</strong> — optionnelles, visibles publiquement par défaut sauf configuration contraire dans vos paramètres</li>
          <li><strong className="text-white">Posts et commentaires</strong> — publics sauf configuration de confidentialité spécifique</li>
          <li><strong className="text-white">Objectifs personnels</strong> — visibles selon vos préférences de confidentialité</li>
        </ul>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">2.3 Données techniques</h3>
        <ul className="text-zinc-300 space-y-1">
          <li><strong className="text-white">Adresse IP</strong> — conservée dans les logs serveur pendant 30 jours, à des fins de sécurité et de modération</li>
          <li><strong className="text-white">Cookies de session</strong> — utilisés par NextAuth pour maintenir votre connexion, durée 30 jours</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul className="text-zinc-300 space-y-1">
          <li>Le fonctionnement et la fourniture du service (authentification, affichage du profil, suivi du poids)</li>
          <li>La modération et la sécurité de la plateforme</li>
          <li>L&apos;envoi de notifications relatives à votre activité sur la plateforme (si activées)</li>
          <li>La vérification des comptes et la prévention des abus</li>
        </ul>
        <p>
          Vos données ne sont <strong className="text-white">jamais utilisées à des fins publicitaires</strong> ou
          de profilage commercial.
        </p>
      </Section>

      <Section title="4. Partage des données">
        <p>
          3l4n ne vend, ne loue et ne partage aucune de vos données personnelles avec des tiers à des
          fins commerciales. Vos données peuvent être transmises uniquement aux prestataires techniques
          strictement nécessaires au fonctionnement du service :
        </p>
        <div className="space-y-3 not-prose mt-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white font-semibold text-sm">Hetzner Online GmbH</p>
            <p className="text-zinc-400 text-xs mt-0.5">Hébergement du serveur — Allemagne (UE)</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white font-semibold text-sm">Cloudflare, Inc.</p>
            <p className="text-zinc-400 text-xs mt-0.5">CDN et stockage des médias (R2) — cdn.3l4n.com</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white font-semibold text-sm">Upstash</p>
            <p className="text-zinc-400 text-xs mt-0.5">Cache et file de messages (Redis) — usage interne uniquement</p>
          </div>
        </div>
        <p className="mt-4">
          Ces prestataires traitent vos données uniquement sur instruction de 3l4n et dans le cadre
          de leurs propres politiques de confidentialité conformes au RGPD.
        </p>
      </Section>

      <Section title="5. Durée de conservation">
        <ul className="text-zinc-300 space-y-2">
          <li><strong className="text-white">Données de compte</strong> — conservées pendant toute la durée de vie du compte</li>
          <li><strong className="text-white">Données de poids, posts et commentaires</strong> — conservés pendant toute la durée de vie du compte et supprimés dans les <strong className="text-white">30 jours</strong> suivant la suppression du compte</li>
          <li><strong className="text-white">Logs serveur (IP)</strong> — conservés <strong className="text-white">30 jours</strong> glissants</li>
          <li><strong className="text-white">Cookies de session</strong> — expiration après <strong className="text-white">30 jours</strong> d&apos;inactivité</li>
        </ul>
      </Section>

      <Section title="6. Vos droits (RGPD)">
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679),
          vous disposez des droits suivants sur vos données :
        </p>
        <ul className="text-zinc-300 space-y-2">
          <li><strong className="text-white">Droit d&apos;accès</strong> — obtenir une copie de vos données personnelles</li>
          <li><strong className="text-white">Droit de rectification</strong> — corriger des données inexactes ou incomplètes</li>
          <li><strong className="text-white">Droit à l&apos;effacement</strong> — demander la suppression de vos données (&laquo; droit à l&apos;oubli &raquo;)</li>
          <li><strong className="text-white">Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible</li>
          <li><strong className="text-white">Droit d&apos;opposition</strong> — vous opposer à certains traitements de vos données</li>
          <li><strong className="text-white">Droit à la limitation</strong> — demander la suspension temporaire du traitement</li>
        </ul>
        <p>
          Pour exercer l&apos;un de ces droits, contactez-nous à{' '}
          <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>.
          Nous nous engageons à répondre dans un délai d&apos;un mois maximum.
        </p>
        <p>
          Vous disposez également du droit de déposer une réclamation auprès de la{' '}
          <strong className="text-white">CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :
          {' '}<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">www.cnil.fr</a>
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          3l4n utilise uniquement des <strong className="text-white">cookies strictement nécessaires</strong> au
          fonctionnement du service :
        </p>
        <ul className="text-zinc-300 space-y-2">
          <li>
            <strong className="text-white">Cookie de session NextAuth</strong> — maintient votre connexion pendant 30 jours.
            Sans ce cookie, vous devrez vous reconnecter à chaque visite.
          </li>
        </ul>
        <p>
          3l4n <strong className="text-white">n&apos;utilise aucun cookie publicitaire</strong>, aucun cookie de
          tracking tiers (Google Analytics, Facebook Pixel, etc.) et aucun cookie de profilage.
          Aucun consentement aux cookies n&apos;est donc requis au-delà du cookie de session.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <p>
          3l4n met en œuvre des mesures techniques et organisationnelles appropriées pour protéger
          vos données contre tout accès non autorisé, perte ou altération, notamment :
        </p>
        <ul className="text-zinc-300 space-y-1">
          <li>Connexions chiffrées (HTTPS/TLS)</li>
          <li>Mots de passe hashés avec bcrypt</li>
          <li>Tokens CSRF et en-têtes de sécurité HTTP</li>
          <li>Accès restreint aux bases de données</li>
        </ul>
      </Section>

      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">
          Des questions sur vos données ?{' '}
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
