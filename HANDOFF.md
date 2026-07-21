# HANDOFF — ForTheSoul (reprise en nouvelle conversation)

> Dernière mise à jour : 2026-07-21. Ce fichier permet de reprendre le travail
> exactement où on s'est arrêté. **À lire en premier dans une nouvelle session.**

---

## 0. Contexte projet
Plateforme Next.js 16 (App Router, Tailwind v4, next-intl FR/DE/EN) de curation
d'expériences bien-être suisses (danse, méditation, yoga, sons, retraites),
façon **retreat.guru** mais incarnée par **Didier Picamoles** (fondateur).
Marque **ForTheSoul** (logo doré). Base **Supabase** en ligne.

## 1. Emplacement & lancement ⚠️ IMPORTANT
- **Le projet a été déplacé** dans `/Users/rodrigue/Desktop/plateforme`
  (l'ancien `~/Documents/plateforme` ne contient plus qu'un `.next` vide).
  → Toujours travailler en **chemins absolus vers Desktop**. Le shell du harness
  se réinitialise parfois sur l'ancien chemin Documents — ne pas s'y fier.
- **Dev server** : `cd /Users/rodrigue/Desktop/plateforme && npm run dev -- --port 3100`
  (le **port 3000 est pris par un autre projet, WINDO** — ne pas l'utiliser).
  URL : http://localhost:3100
- Vérifs : `npm run lint` (doit être clean).

## 2. Supabase (EN LIGNE)
- Projet `pccbiclpgrjmejpybcki` (région eu-west-1).
- **Migrations + seed déjà appliqués** : `0001`→`0008` + `seed.sql`, `seed_extra.sql`,
  `seed_reviews.sql`.
- Pour exécuter du SQL / migrations : `psql "$DATABASE_URL"` — **`DATABASE_URL`
  est dans `.env.local`** (connection string Session pooler, mot de passe
  URL-encodé). Le REST API avec la clé service ne fait PAS de DDL.
- Contenu actuel : **17 événements** approuvés (8 cantons), **8 praticiens**,
  **12 lieux**, **18 avis**, 5 catégories, 3 contacts newsletter.
- Astuce : après une migration, `notify pgrst, 'reload schema';` pour rafraîchir
  le cache de l'API.

## 3. Comptes de test (mot de passe commun `ForTheSoul2026!`)
| Rôle | E-mail | Espace |
|---|---|---|
| Participant | `participant@forthesoul.ch` | `/espace-participant` |
| Praticien | `praticien@forthesoul.ch` | `/espace-praticien` (5 crédits) |
| Admin (Didier) | `welcome@forthesoul.ch` | `/admin` |
- Créés via l'API admin Supabase (confirmés). **À supprimer/changer avant prod.**
- Déconnexion fiable : visiter `/api/logout` (ou le bouton, qui pointe dessus).

## 4. Git
- Branche de travail : **`refonte-landing`**. **Rien n'est poussé** (local only).
- Beaucoup de commits (voir `git log`). Pas de remote configuré.

## 5. Ce qui est FAIT (cette phase de refonte)
- Base Supabase branchée + données suisses + avis.
- **Landing façon retreat.guru** : hero **vidéo** (`public/hero.mp4`) + voile chaud,
  tuiles catégories en **vraies photos**, sélection, prochaines expériences,
  bandeau « curation de Didier », **FAQ** (accordéon), footer.
- **Didier** : portrait sur `/a-propos` (`public/didier-maroc.jpg`), photo méditation
  sur le bandeau accueil, **pas** sur le hero (present mais pas frontal).
- **Barre d'onglets mobile** (façon appli) : Accueil · Favoris · **Expériences**
  (centre surélevé) · Praticiens · Compte. (`components/MobileTabBar.tsx`)
- **Catalogue** (`/experiences`) : recherche + **dates Du/Au toujours visibles** +
  **filtres repliables** (bouton « Filtres ») + **bascule Liste/Carte**
  (`components/EventsMap.tsx`, OpenStreetMap/Leaflet, sans clé) + calendrier + rayon.
- **Fiche expérience** : vraie photo, **note ★ + liste d'avis**, bouton **Réserver**
  (mailto praticien — pas de paiement), **Ajouter à mon agenda** (Google + .ics via
  `/api/events/[slug]/ics`).
- **Fiche praticien** : **badge « Avis Google »** (lien + note + nb d'avis, saisis
  dans le profil praticien → `links.googleUrl/googleRating/googleCount`).
- **Fiche lieu** : carte OpenStreetMap intégrée.
- **Espace participant** : favoris enregistrés + agenda + déconnexion.
- **Admin** : refus d'événement/praticien **avec motif + e-mail**, gestion lieux/crédits,
  **export CSV newsletter incrémental** (« nouveaux uniquement », `exported_at`).
- **Bug crédit corrigé** (migration `0006`) : `consume_credit` était bloqué par un
  garde-fou → un praticien peut désormais publier.
- **Connexion** : redirection par rôle (admin→/admin, etc.).
- Avis : migration `0008` (table `reviews` + `rating_avg`/`rating_count` sur events
  via trigger).

## 6. RESTE À FAIRE (priorité)
### 🔴 Bloquant mise en ligne
1. **Stripe** : vraies clés test → webhook → clés live. Définir **packs de crédits +
   tarifs** et le **vrai IBAN** dans `lib/credits.ts` (placeholders actuellement).
2. **Resend** : vérifier `forthesoul.ch`, coller `RESEND_API_KEY` (sinon e-mails
   applicatifs seulement en console).
3. **Supabase Auth** : configurer l'envoi du **mail de confirmation** (SMTP) pour
   les vraies inscriptions.
4. **Déploiement Vercel** + domaine `forthesoul.ch`.

### 🟠 Contenu
5. Image pour **SELVA (Costa Rica)** — garde une vignette dégradée (pas de photo).
6. Bios praticiens / descriptions d'événements du seed = `PLACEHOLDER` (valider
   avec Didier). Ré-exports photos Didier **Costa Rica** (vides) et **Dromadaire**.
7. Retirer l'**exemple d'avis Google** de démo sur la fiche `antara-earth`.

### 🟡 Optim / nettoyage
8. **Compresser `public/hero.mp4`** (19 Mo → ~3-5 Mo). Il y a aussi un `hero.mp4`
   en trop à la racine (doublon, non versionné) — à supprimer.
9. Supprimer les **comptes de test** + changer le mot de passe avant prod.
10. Re-tester la **sécurité RLS** en ligne (`docs/SECURITE.md`).

## 7. Détails techniques utiles
- Assets : `public/logo.png`, `logo-icon.png`, `didier-maroc.jpg`, `didier-yoga.jpg`,
  `hero.mp4` + `hero-poster.jpg`, `cat-*.jpg` (catégories), `events/*.jpg` (événements).
- Dossiers sources bruts (ignorés par git) : `image de Didier/`, `Images/`,
  `image experiences test/`.
- i18n : textes dans `messages/{fr,de,en}.json`. Les espaces admin/praticien/participant
  sont en FR uniquement ; le public est FR/DE/EN.
- Le panneau navigateur intégré **ne peint pas les iframes/tuiles tierces**
  (cartes OSM pâles en aperçu) — normal, OK dans un vrai navigateur.

## 8. Pour reprendre
1. Lancer le serveur (section 1) sur le port 3100.
2. `Cmd+Shift+R` dans le navigateur (le mode dev périme les onglets ouverts après
   une recompilation → sinon boutons/déconnexion qui « ne répondent pas »).
3. Voir `PROGRESS.md` pour le suivi détaillé.
