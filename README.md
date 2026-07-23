# ForTheSoul

Plateforme suisse curée d'expériences conscientes (danse libre, méditation,
yoga, sons, retraites) — chaque praticien·ne et chaque expérience sont validés
par l'administrateur.

**Stack** : Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(PostgreSQL + PostGIS + RLS + Auth + Storage) · Stripe · Resend · next-intl
(FR/DE/EN) · Vercel.

## Démarrage

```bash
cp .env.example .env.local   # puis remplir les clés (voir PROGRESS.md)
npm install
npm run dev
```

Base de données : exécuter `supabase/migrations/0001…0005` puis
`supabase/seed.sql` dans le SQL Editor du projet Supabase.

## Documents

- [BUILD-BRIEF.md](BUILD-BRIEF.md) — brief de build (source de vérité du périmètre)
- [PROGRESS.md](PROGRESS.md) — état d'avancement + checklist de branchement
- [docs/ADMIN.md](docs/ADMIN.md) — guide d'utilisation pour l'admin (Didier)
- [docs/LIVRAISON.md](docs/LIVRAISON.md) — transfert des comptes au client
- [docs/SECURITE.md](docs/SECURITE.md) — audit RLS & sécurité
- [docs/FUTUR-schema.sql](docs/FUTUR-schema.sql) — tables anticipées (avis, blog, réservation)
