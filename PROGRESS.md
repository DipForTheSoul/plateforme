# PROGRESS — ForTheSoul

> Suivi d'avancement lisible par Victor & Rodrigue. Dernière mise à jour : 2026-07-20.

## État global : les 10 phases sont codées ✅ — reste le branchement des comptes (Rodrigue)

| Phase | Contenu | État |
|---|---|---|
| 0 | Fondations : Next.js 16 + Tailwind v4, schéma SQL complet, PostGIS, RLS, seed | ✅ Codé |
| 1 | Auth & rôles (participant / praticien / admin), protection des routes | ✅ Codé |
| 2 | CRUD événements, récurrence (occurrences générées), espaces praticien & admin | ✅ Codé |
| 3 | Catalogue, recherche instantanée, filtres, calendrier interactif, top listings | ✅ Codé |
| 4 | Annuaire praticiens, fiches lieux, géocodage Nominatim, rayon km (ST_DWithin) | ✅ Codé |
| 5 | Favoris liés à l'appareil (localStorage + miroir analytique) | ✅ Codé |
| 6 | Stripe Checkout + webhook signé/idempotent, blocage à 0 crédit, QR/IBAN manuel | ✅ Codé |
| 7 | E-mails Resend (repli console), newsletter : import, tags, export CSV MailerLite | ✅ Codé |
| 8 | Multilingue FR/DE/EN (next-intl), détection navigateur, hreflang, sitemap localisé | ✅ Codé |
| 9 | SEO (JSON-LD, sitemap, robots, OG image), analytics sans cookies, page À propos | ✅ Codé |
| 10 | Anti-spam (honeypot + rate-limit), docs admin & livraison | ✅ Codé |

## À faire par Rodrigue (checklist de branchement)

1. **Supabase** : créer le projet client → coller les 3 clés dans `.env.local`
   (voir `.env.example`) → exécuter dans le SQL Editor, dans l'ordre :
   `supabase/migrations/0001…0005`, puis `supabase/seed.sql`.
2. **Compte admin** : s'inscrire sur le site avec `welcome@forthesoul.ch`,
   confirmer l'e-mail, puis relancer les 2 derniers `update` de `seed.sql`
   (promotion admin + rattachement de la fiche de Didier).
3. **Stripe (mode test)** : coller les clés test → `stripe listen --forward-to
   localhost:3000/api/stripe/webhook` → payer avec 4242 4242 4242 4242 →
   vérifier que les crédits n'arrivent QUE via le webhook.
4. **Resend** : vérifier le domaine forthesoul.ch, coller `RESEND_API_KEY`
   (sans clé : e-mails logués en console — aucun blocage).
5. **Vercel** : connecter le repo GitHub, recopier les variables d'env.
6. **Placeholders à remplacer** (chercher `PLACEHOLDER` dans le code) :
   logo officiel (`public/logo.svg`), photo de Didier (`public/didier.jpg`,
   blocs marqués dans `app/[locale]/page.tsx` et `a-propos/page.tsx`),
   IBAN réel (`lib/credits.ts`), tarifs des packs (`lib/credits.ts`),
   bios/textes de seed à valider avec Didier.

## Contrôles effectués

- `npm run build` : voir dernière ligne du journal de commits.
- RLS : policies écrites table par table (`supabase/migrations/0003_rls.sql`),
  triggers anti-escalade (rôle, statut, crédits, is_top). **À re-tester en
  ligne une fois le projet Supabase branché** : suivre `docs/SECURITE.md`.

## Décisions prises pendant le build

- **Géocodage : Nominatim/OSM** (gratuit, sans clé) — choix validé par Victor.
- **FR par défaut sans préfixe d'URL**, DE/EN sous `/de` `/en` (hreflang OK).
- **Récurrence** : occurrences générées comme lignes filles (`parent_event_id`)
  → calendrier et recherche restent simples ; 1 crédit par dépôt (pas par occurrence).
- **Favoris sans compte** : localStorage = source de vérité ; la table
  `favorites` n'est qu'un miroir insert-only (aucune lecture anonyme).
- **Espaces praticien/admin en français** (utilisateurs francophones V1) ;
  le public est entièrement FR/DE/EN. Clés à ajouter dans `messages/*.json`
  si besoin de traduire ces espaces plus tard.
- **Analytics sans cookies** : table `page_views` interne → pas de bannière.

## Demandes de Victor (REQUESTS.md)

Rien en attente.
