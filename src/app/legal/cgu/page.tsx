import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — 3l4n',
  description: 'Conditions Générales d\'Utilisation de la plateforme 3l4n.',
}

export default function CGUPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black text-white mb-2">
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="text-white/30 text-sm mb-10">Dernière mise à jour : avril 2025</p>

      <Section title="Article 1 — Objet et acceptation">
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont pour objet de définir
          les règles d&apos;accès et d&apos;utilisation de la plateforme <strong className="text-white">3l4n</strong>,
          accessible à l&apos;adresse <strong className="text-white">3l4n.com</strong>.
        </p>
        <p>
          L&apos;utilisation de 3l4n implique l&apos;acceptation pleine et entière des présentes CGU.
          Si vous n&apos;acceptez pas ces conditions, vous devez cesser d&apos;utiliser le service.
        </p>
      </Section>

      <Section title="Article 2 — Description du service">
        <p>
          3l4n est un réseau social bienveillant dédié au suivi du poids et du bien-être. Il permet aux
          utilisateurs de :
        </p>
        <ul className="text-zinc-300 space-y-1">
          <li>Enregistrer et suivre leur évolution de poids dans le temps</li>
          <li>Publier des posts, commentaires et photos pour partager leur parcours</li>
          <li>Interagir avec une communauté bienveillante et sans jugement</li>
          <li>Se fixer des objectifs personnels et suivre leurs progrès</li>
        </ul>
        <p>
          Le service est accessible gratuitement après inscription. 3l4n se réserve le droit de faire
          évoluer ses fonctionnalités à tout moment.
        </p>
      </Section>

      <Section title="Article 3 — Inscription et compte">
        <h3 className="text-white font-semibold text-lg mt-6 mb-2">3.1 Responsabilité du compte</h3>
        <p>
          L&apos;utilisateur est seul responsable de son compte, de ses identifiants de connexion et de
          l&apos;ensemble des actions effectuées depuis son compte. Il s&apos;engage à maintenir ses
          informations à jour et à signaler toute utilisation frauduleuse à <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>.
        </p>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">3.2 Données de poids et véracité</h3>
        <p>
          3l4n repose sur la confiance mutuelle de sa communauté. L&apos;utilisateur s&apos;engage à
          renseigner des données de poids sincères et réelles. La saisie intentionnelle de faux
          poids ou de données trompeuses dans le but de manipuler des classements ou de nuire
          à d&apos;autres utilisateurs est strictement interdite.
        </p>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">3.3 Comportement interdit</h3>
        <p>Il est interdit de :</p>
        <ul className="text-zinc-300 space-y-1">
          <li>Publier tout contenu à caractère haineux, discriminatoire, harcelant, menaçant ou injurieux</li>
          <li>Cibler, intimider ou harceler d&apos;autres membres de la communauté</li>
          <li>Créer plusieurs comptes dans le but de manipuler des classements, votes ou statistiques</li>
          <li>Usurper l&apos;identité d&apos;une autre personne ou d&apos;un tiers</li>
          <li>Utiliser le service à des fins commerciales non autorisées</li>
        </ul>
      </Section>

      <Section title="Article 4 — Contenu publié">
        <h3 className="text-white font-semibold text-lg mt-6 mb-2">4.1 Propriété du contenu</h3>
        <p>
          L&apos;utilisateur reste propriétaire de tout contenu qu&apos;il publie sur 3l4n (posts,
          photos, commentaires). En publiant du contenu, il accorde à 3l4n une licence non exclusive,
          mondiale et gratuite pour l&apos;afficher, le reproduire et le distribuer dans le cadre du
          fonctionnement normal de la plateforme.
        </p>

        <h3 className="text-white font-semibold text-lg mt-6 mb-2">4.2 Contenu interdit</h3>
        <p>Sont notamment interdits les contenus :</p>
        <ul className="text-zinc-300 space-y-1">
          <li>Haineux, discriminatoires, racistes, homophobes ou incitant à la violence</li>
          <li>Contenant de la nudité ou du contenu à caractère sexuel explicite</li>
          <li>Spam, publicité non sollicitée ou liens malveillants</li>
          <li>Contenant des données personnelles de tiers sans leur consentement</li>
          <li>Protégés par des droits d&apos;auteur sans autorisation de leur titulaire</li>
          <li>Encourageant des comportements dangereux pour la santé (régimes extrêmes, etc.)</li>
        </ul>
      </Section>

      <Section title="Article 5 — Modération">
        <p>
          3l4n se réserve le droit de supprimer tout contenu et/ou de suspendre ou supprimer tout
          compte qui ne respecterait pas les présentes CGU, sans préavis et sans avoir à justifier
          sa décision.
        </p>
        <p>
          Si vous constatez un contenu qui vous semble contraire à ces règles, vous pouvez le signaler
          à <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>.
          3l4n s&apos;engage à traiter tout signalement dans les meilleurs délais.
        </p>
      </Section>

      <Section title="Article 6 — Données personnelles">
        <p>
          Le traitement des données personnelles des utilisateurs est décrit en détail dans la{' '}
          <a href="/legal/privacy" className="text-emerald-400 hover:underline">Politique de Confidentialité</a>.
          Conformément au Règlement Général sur la Protection des Données (RGPD), les utilisateurs
          disposent de droits sur leurs données qu&apos;ils peuvent exercer via <a href="mailto:contact@3l4n.com" className="text-emerald-400 hover:underline">contact@3l4n.com</a>.
        </p>
      </Section>

      <Section title="Article 7 — Limitation de responsabilité">
        <p>
          3l4n met en œuvre tous les moyens raisonnables pour assurer la disponibilité et la
          continuité du service, mais ne peut garantir un accès ininterrompu. Le service est
          fourni « en l&apos;état », sans garantie de résultat.
        </p>
        <p>
          3l4n ne saurait être tenu responsable des contenus publiés par ses utilisateurs, ni des
          dommages directs ou indirects résultant de l&apos;utilisation ou de l&apos;impossibilité
          d&apos;utiliser le service.
        </p>
        <p>
          Les informations de santé partagées sur la plateforme (poids, IMC, etc.) sont à titre
          indicatif et ne constituent en aucun cas des conseils médicaux. L&apos;utilisateur reste
          seul responsable de ses décisions en matière de santé.
        </p>
      </Section>

      <Section title="Article 8 — Modification des CGU">
        <p>
          3l4n se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
          seront informés de toute modification substantielle par notification sur la plateforme
          ou par email. La poursuite de l&apos;utilisation du service après notification vaut
          acceptation des nouvelles CGU.
        </p>
      </Section>

      <Section title="Article 9 — Droit applicable">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, les parties
          s&apos;efforceront de trouver une solution amiable avant tout recours judiciaire.
          À défaut d&apos;accord amiable, tout litige relatif à l&apos;interprétation ou à
          l&apos;exécution des présentes CGU sera soumis aux tribunaux compétents français.
        </p>
      </Section>

      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">
          Des questions ? Écris-nous à{' '}
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
