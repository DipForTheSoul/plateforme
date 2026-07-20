# PROGRESS — ForTheSoul

> Suivi d'avancement lisible par Victor & Rodrigue. Dernière mise à jour : 2026-07-20.

## État global : 10 phases codées ✅ — base Supabase EN LIGNE ✅ — refonte visuelle façon retreat.guru ✅

### Fait le 2026-07-20 (session refonte)
- **Base Supabase branchée et peuplée** : migrations `0001→0005` + `seed.sql`
  appliquées sur le projet `pccbiclpgrjmejpybcki` (via `psql`, `DATABASE_URL`
  dans `.env.local`). PostGIS OK, recherche par rayon testée (Berne 30 km ✓).
  7 lieux, 5 praticiens, 8 événements suisses, 5 catégories, 3 contacts.
- **Logo réel intégré** : `public/logo-icon.png` (symbole extrait) + wordmark
  dans le header et le footer (remplace `logo.svg`).
- **Photos de Didier** : `public/didier-yoga.jpg` (hero, méditation) et
  `public/didier.jpg` (bandeau « curation »). Présence juste, pas frontale.
- **Refonte landing** (`app/[locale]/page.tsx`) façon retreat.guru : hero + barre
  de recherche à bouton intégré + badges de confiance, tuiles catégories,
  « Sélection du moment », « Prochaines expériences », bandeau incarné Didier
  (citation + signature). Nouvelles clés i18n FR/DE/EN.
- Vérifs : `npm run lint` clean ; SSR FR/DE/EN 200 ; catalogue, fiches
  praticiens/lieux/événement 200 ; recherche `?q=gong` OK.
- Dev : ForTheSoul tourne sur **:3100/:3001** (port 3000 pris par un autre projet).

### À fournir par Rodrigue (assets pour finaliser le style)
- 1 vidéo hero courte (paysage/danse/méditation) — sinon photo pleine largeur.
- 5 photos de catégories (une par univers) pour remplacer les tuiles dégradé.
- Ré-export propre des photos **Costa Rica** (fichiers vides) et **Dromadaire**
  (fichier `.~tmp` Lightroom). 1 photo horizontale de Didier bienvenue.

## Reste : branchement des comptes tiers (Rodrigue)

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
