# Ismaik Platform - AI Learning Management System

Une plateforme de gestion d'apprentissage (LMS) innovante construite avec Next.js, intégrant des fonctionnalités d'IA pour une expérience d'apprentissage personnalisée.

## Table des matières
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Contribution](#contribution)
- [Licence](#licence)

## Fonctionnalités
- Navigation et filtrage intelligent des cours
- Système de paiement sécurisé via Stripe
- Base de données NoSQL avec MongoDB
- Authentification sécurisée via Clerk
- ORM avec Prisma
- Suivi de progression des chapitres
- Calcul automatique de la progression des cours
- Tableau de bord étudiant personnalisé
- Interface enseignant
- Création et gestion de cours
- Gestion des chapitres avec fonction glisser-déposer
- Gestion des médias (thumbnails, documents, vidéos)
- Lecteur vidéo intégré
- Éditeur de texte enrichi
- Fonctionnalités d'IA pour l'apprentissage personnalisé

## Technologies utilisées
- Framework: Next.js 14
- Base de données: Prisma/MongoDB
- Authentification: Clerk
- Composants UI: Radix UI, Shadcn/ui
- Gestion des formulaires: React Hook Form
- Requêtes API: Axios
- Style: Tailwind CSS
- Gestion des fichiers: Uploadthing, Cloudinary
- Support Markdown: React Markdown Preview, React MD Editor
- Intégration IA: [Spécifiez vos technologies d'IA]

## Installation

### Prérequis
- Node.js
- npm ou yarn
- Git

### Cloner le projet
```bash
git clone https://github.com/assylk/ismaik-platform.git
cd ismaik-platform
```

### Installation des dépendances
```bash
npm install
# ou
yarn install
```

### Configuration des variables d'environnement
Créez un fichier .env.local à la racine du projet :
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_REDIRECT=/

DATABASE_URL=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_TEACHER_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000

STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Ajoutez vos variables d'environnement spécifiques à l'IA ici
AI_API_KEY=
```

### Lancer le serveur de développement
```bash
npm run dev
# ou
yarn dev
```

Accédez à [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Utilisation
La plateforme Ismaik offre une expérience d'apprentissage enrichie par l'IA. Les utilisateurs peuvent accéder aux cours, suivre leur progression et bénéficier de recommandations personnalisées basées sur leur parcours d'apprentissage.

## Contribution
Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/NouvelleFonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Pushez vers la branche (`git push origin feature/NouvelleFonctionnalite`)
5. Ouvrez une Pull Request

## Licence
Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.
