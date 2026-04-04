# 3l4n — Suivi de poids communautaire

Application mobile-first de suivi de poids avec feed social, objectifs personnalisés et statistiques de progression.

## Stack

- **Next.js 15** (App Router)
- **Prisma** + PostgreSQL
- **NextAuth v5** (credentials + Google OAuth)
- **Tailwind CSS** (dark theme, emerald accent)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Base de données

### Appliquer le schéma (première fois ou après modifications)

```bash
npx prisma db push
```

> ⚠️ Cette commande applique les changements du schéma directement en base sans créer de fichier de migration. À utiliser en développement.

### Générer le client Prisma

```bash
npx prisma generate
```

### Variables d'environnement

Copie `.env.example` vers `.env` et remplis les valeurs :

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Fonctionnalités

### Suivi de poids
- Enregistrement de pesées quotidiennes avec notes
- Graphique de courbe de poids
- Statistiques : poids actuel, évolution, streak, objectif

### Objectif de poids
- Définir un poids de départ (`startWeight`) et un objectif (`targetWeight`)
- `GoalCard` : barre de progression avec % atteint
- Badge motivant : 🔥 En feu (>50%), 💪 Continue (<50%), 🏆 Objectif atteint!

### Page Paramètres (`/settings`)
- Modifier nom, bio
- Définir poids de départ et objectif de poids
- Déconnexion

### Feed social
- Partage de posts
- Réactions : COURAGE, EN_FEU, SOLIDAIRE

## API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/user` | Profil utilisateur connecté |
| `PATCH` | `/api/user` | Mise à jour nom, bio, targetWeight, startWeight |
| `GET` | `/api/weight` | Entrées de poids |
| `POST` | `/api/weight` | Ajouter une pesée |
| `GET` | `/api/posts` | Posts du feed |
| `POST` | `/api/posts` | Créer un post |
| `POST` | `/api/posts/[id]/react` | Réagir à un post |

## Modèle Prisma (User)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  bio           String?
  targetWeight  Float?   // Objectif de poids (kg)
  startWeight   Float?   // Poids de départ (kg)
  // ...
}
```

> Après toute modification du schéma, lancer : `npx prisma db push`
