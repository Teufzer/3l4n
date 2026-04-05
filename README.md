# 3l4n — Réseau social de suivi de poids

> **⚠️ Projet archivé.** Ce projet a été fermé en avril 2026 pour des raisons de sécurité et de responsabilité vis-à-vis des données personnelles des utilisateurs. Le code est publié en open source à des fins éducatives.

---

## C'est quoi 3l4n ?

**3l4n** (leet speak pour *élan*) était un réseau social centré sur le suivi de poids et le bien-être — pensé comme Twitter mais pour la perte/prise de poids. Le site a atteint 650+ membres avant sa fermeture.

Construit entièrement avec l'IA (Claude) en quelques semaines, sans expertise en développement de la part du créateur.

### Fonctionnalités

- 🐦 **Feed social** style Twitter — posts, commentaires, réactions (💪🔥❤️), reposts
- ⚖️ **Dashboard de poids** — courbe Recharts, stats, IMC, import CSV
- 👤 **Profils publics/privés** — follow, unfollow, block, demandes de suivi (Instagram-style)
- 🔔 **Notifications** — mentions, réactions, follows, reposts
- 📸 **Photos** dans les posts et commentaires via Cloudflare R2
- 🔐 **Auth complète** — Google OAuth + email/password, vérification email, reset password
- 🛡️ **Panel admin** — ban, certifier, détecter les trolls
- 🔒 **Paramètres privacy** — profil privé, poids privé, taille privée, IMC privé

### Stack technique

| Technologie | Usage |
|---|---|
| Next.js 15 (App Router) | Framework fullstack |
| Tailwind CSS | Styles |
| Prisma v7 + @prisma/adapter-pg | ORM |
| PostgreSQL | Base de données |
| NextAuth v5 | Authentification |
| Cloudflare R2 | Stockage photos |
| Resend | Emails transactionnels |
| Upstash Redis | Rate limiting |
| Recharts | Graphiques |

---

## Installation (pour les devs qui veulent reprendre le projet)

### Prérequis

- Node.js 22+
- PostgreSQL
- Compte Cloudflare (pour R2, optionnel)
- Compte Resend (pour les emails)

### Setup

```bash
# Cloner le repo
git clone https://github.com/Teufzer/3l4n.git
cd 3l4n

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec tes propres valeurs

# Générer le client Prisma
npx prisma generate

# Appliquer le schéma en DB
npx prisma db push

# Lancer en développement
npm run dev
```

### Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

```
DATABASE_URL="postgresql://user:password@localhost:5432/3l4n"
AUTH_SECRET="générer avec: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
RESEND_API_KEY="re_..."
RESEND_FROM="noreply@ton-domaine.com"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="https://..."
```

---

## Leçons apprises

- Construire un réseau social avec l'IA est possible techniquement
- Mais la **responsabilité légale et sécuritaire** (RGPD, protection des données de santé) ne peut pas être déléguée à l'IA
- Pour ce type de projet, il aurait fallu une **architecture local-first** (données stockées sur l'appareil de l'utilisateur, jamais sur un serveur central)

---

## Licence

MIT — fais-en ce que tu veux. Crédits appréciés mais pas obligatoires.

---

*Projet créé par [Killian (Teufzer)](https://github.com/Teufzer) avec l'aide de Claude (Anthropic).*
