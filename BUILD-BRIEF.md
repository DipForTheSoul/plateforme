# ForTheSoul — Brief de build

> Document de référence interne de l'équipe technique : il fixe le périmètre, le
> socle technique et l'ordre de construction du projet. Il fait foi en cas de doute
> sur ce qui est inclus ou non.

---

## 0. Méthode de travail

- La plateforme est construite **dans l'ordre des phases** de la section 5, sans sauter d'étape.
- Le développement avance par incréments : on ne s'arrête qu'une fois une phase **terminée et vérifiée**, ou si l'on est bloqué sur un **élément requis** que seul le client peut fournir (section 2).
- Après chaque incrément fonctionnel : **commit** avec un message clair et mise à jour de `PROGRESS.md`.
- En début de session, on relit `PROGRESS.md` (état d'avancement) et `REQUESTS.md` (demandes de Victor).
- Code **propre, typé (TypeScript), commenté aux endroits sensibles**. Aucun raccourci sur la sécurité.
- Si un élément manque, on ne bloque pas l'ensemble : on pose un *placeholder clairement marqué* (voir §2) et on poursuit.

---

## 1. Le projet en bref

**ForTheSoul** est une plateforme suisse curée de mise en relation entre :
- des **praticiens** (instructeurs, facilitateurs) qui publient des expériences : danse libre/extatique, méditation, yoga, sons, retraites ;
- des **participants** qui cherchent ces expériences (par mots-clés, dates, distance, catégorie, langue).

Positionnement : **humain, communautaire, curé** (l'anti-Retreat-Guru). Chaque praticien est validé par l'administrateur (Didier). Site de référence pour l'identité visuelle : **forthesoul.ch** (l'actuel).

Objectifs : recherche moderne (calendrier indispensable), plateforme **autonome** (les praticiens publient, l'admin valide), **architecture évolutive**.

---

## 2. AVANT DE CODER — éléments à réclamer / confirmer

**Commence par présenter cette checklist à l'humain (Rodrigue).** Pour chaque ligne : si l'élément est disponible, utilise-le ; sinon, applique la solution de repli indiquée et **continue** (ne bloque pas).

### 2.1 Comptes & secrets (à mettre dans `.env.local`, jamais commités)
- [ ] **Supabase** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. *Repli : demande à Rodrigue de créer un projet Supabase (gratuit pour développer) et de coller les clés.*
- [ ] **Stripe** (mode test) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. *Repli : demande les clés de test ; le paiement peut être développé et testé en mode test sans compte définitif.*
- [ ] **Resend** (envoi d'e-mails) : `RESEND_API_KEY`. *Repli : logue les e-mails en console tant que la clé n'est pas fournie.*
- [ ] **Géocodage** (pour la recherche par rayon) : clé d'une API de géocodage (Google, Mapbox ou Nominatim/OpenStreetMap gratuit). *Repli : Nominatim (gratuit, sans clé) pour le développement.*
- [ ] **Dépôt Git / Vercel** : confirme que le repo est connecté à Vercel (déploiements preview automatiques).

### 2.2 Identité visuelle
- [ ] **Couleurs & logo** : l'identité est celle de **forthesoul.ch actuel**. **Va inspecter le site en ligne** pour en extraire la palette et récupérer le logo ; sinon demande le fichier logo à Rodrigue. Reproduis l'esprit (naturel, spirituel, chaleureux) en le **professionnalisant** — pas de table rase.
- [ ] **Photos de Didier / de marque** : si aucune n'est fournie, **génère des placeholders** (portraits/ambiances génériques) **clairement marqués `// PLACEHOLDER — à remplacer par une vraie photo de Didier`**, et prévois un emplacement propre pour les remplacer plus tard (page « À propos », signatures).
- [ ] **Visuels des expériences / praticiens / lieux** : tant qu'il n'y a pas de vraies photos, utilise des **vignettes en dégradé élégantes** (par catégorie) avec un motif SVG — jamais d'image cassée. À remplacer ensuite dans le CMS.

### 2.3 Contenus
- [ ] **Données de départ (seed)** : utilise les vrais éléments connus ci-dessous pour peupler la base de démonstration.

**Praticiens de seed :** Antara Earth (danse extatique, Berne) · Didier Picamoles (Humanic Dance & sons, Neuchâtel) · Renaud Daniela (breathwork & sound healing, Vaud) · Amber Dubinsky (vision quest & yoga, international).

**Catégories :** Danse & Mouvement · Méditation & Pleine conscience · Yoga & Somatique · Voyages spirituels · Son & Vibration.

**Événements de seed :** Love Lounge (Berne, Antara Earth, Danse) · Gong for Gaïa meets Humanic Dance (Gampelen, Didier, Son) · SELVA – Vision Quest & Jungle Immersion (Costa Rica, Didier, Voyages) · Humanic Dance – Dancing Spirit (Neuchâtel, Antara, Danse) · Retraite Yoga & Silence (Valais, Amber, Yoga) · Souffle & Présence – Breathwork (Lausanne, Renaud, Méditation) · Sound Healing & Bols Tibétains (Fribourg, Renaud, Son).

- [ ] **Textes** : là où le vrai contenu manque, pose du texte placeholder **cohérent et marqué**, jamais du « lorem ipsum » brut dans l'UI finale.

### 2.4 Langue
- [ ] **On construit d'abord en FRANÇAIS**, avec l'architecture prête pour DE/EN. Le multilingue s'active **en dernière phase** (§5, Phase 8). Ne pas tout tripler en cours de route.

---

## 3. Stack technique (imposée)

- **Front-end** : Next.js (App Router) + React + TypeScript + Tailwind CSS.
- **Back-end / base** : Supabase (PostgreSQL managé) — Auth, Storage, **Row-Level Security (RLS)**, extension **PostGIS** pour la géolocalisation.
- **Paiements** : Stripe (Checkout + webhooks).
- **E-mails** : Resend.
- **Multilingue** : `next-intl`.
- **Hébergement** : Vercel (front) + Supabase (base). *En phase de build, tout tourne sur les comptes de l'agence ; transfert vers les comptes du client à la livraison.*

---

## 4. Modèle de données

Tables (PostgreSQL). **Chaque table a RLS activée** — voir §6.

- **users** — géré par Supabase Auth ; table `profiles` liée : `id`, `email`, `role` (`participant` | `practitioner` | `admin`), `preferred_lang`.
- **practitioners** — `id`, `user_id` (FK), `name`, `bio`, `photos[]`, `contact`, `specialties[]`, `languages[]`, `links`, `credits` (int, solde de publications).
- **venues** — `id`, `name`, `address`, `lat`, `lng` (géocodés), `canton`, `country`, `description`, `capacity`, `rooms`, `contact`, `photos[]`.
- **categories** — `id`, `name`, `slug`.
- **events** — `id`, `title`, `description`, `category_id` (FK), `practitioner_id` (FK), `venue_id` (FK), `start_date`, `end_date`, `recurrence` (null | weekly | biweekly | monthly), `duration`, `price`, `languages[]`, `status` (`pending` | `approved` | `rejected`), `is_top`, `images[]`.
- **favorites** — `id`, `visitor_id` (ou identifiant appareil si non connecté), `event_id` (nullable), `practitioner_id` (nullable).
- **contacts** — `id`, `email`, `first_name`, `last_name`, `interests[]` (tags), `consent`, `opt_in_at` (base newsletter, import Wix).
- **credit_transactions** — `id`, `practitioner_id`, `amount`, `stripe_session_id`, `created_at` (traçabilité des achats de crédits, **idempotence**).

Tables **prévues mais non implémentées** (structure à anticiper, §8) : `reviews` (avis/notes), `blog_posts`, `bookings`.

---

## 5. Ordre de construction (respecte cet ordre)

> Règle : ne pas faire le multilingue, ni les paiements, avant que le cœur fonctionne. Construire des fondations d'abord.

**Phase 0 — Fondations.** Init Next.js + Tailwind + Supabase. Créer le schéma SQL (§4), activer **PostGIS**, écrire les **policies RLS** (§6), charger les données de seed (§2.3). *Vérifier que la RLS bloque bien les accès non autorisés avant d'aller plus loin.*

**Phase 1 — Auth & rôles.** Inscription / connexion / mot de passe oublié / vérification e-mail (Supabase Auth). Les trois rôles : participant, praticien, admin. Protection des routes selon le rôle.

**Phase 2 — Événements & espaces.** CRUD événements. Espace praticien : profil + **dépôt d'événement pré-rempli depuis le profil**. Espace admin : liste des soumissions + **validation / refus / publication en 1 clic** (mobile + desktop). Événements récurrents (générer les occurrences à la création).

**Phase 3 — Découverte.** Catalogue + **recherche instantanée** (texte libre, classée par pertinence) + **filtres** (catégorie, langue, prix, durée, praticien, pays/région/ville) + **calendrier interactif** (jours avec événements visibles, sélection de date/période) + tri par date d'événement + top listings.

**Phase 4 — Praticiens, lieux, rayon.** Annuaire public des praticiens (fiches consultables, recherche par praticien). Fiches lieux. **Géocodage à la création d'un lieu** (lat/lng). **Recherche par rayon km** via PostGIS (`ST_DWithin`).

**Phase 5 — Favoris.** Enregistrement d'expériences et de praticiens en favori (pour démarrer, sans compte participant obligatoire : stockage lié à l'appareil).

**Phase 6 — Paiements.** Stripe Checkout : achat de **packs de publications** en self-service. **Crédits ajoutés UNIQUEMENT via webhook Stripe signé + idempotent** (jamais via le retour navigateur). Tableau de bord praticien (solde, rachat 1 clic, **blocage à 0 crédit**). Paiement « statique » : affichage QR/IBAN + attribution manuelle de crédits par l'admin.

**Phase 7 — Communication.** E-mails automatiques (Resend) : confirmation de dépôt, validé/refusé (avec message admin). Newsletter : import contacts, tags par intérêt/événement, **export CSV segmenté** (MailerLite).

**Phase 8 — Multilingue (EN DERNIER).** `next-intl` FR/DE/EN : interface + contenus, détection de la langue du navigateur, **hreflang + sitemaps par langue**.

**Phase 9 — SEO, analytics, finitions.** SSR, meta/H1/H2, **Schema.org (JSON-LD)**, sitemap auto, robots.txt. Analytics : tableau de bord intégré + connexion Google Analytics (mesure **sans cookies** → pas de bannière). Optimisation images (resize/compress à l'upload). **Touche Didier** : page « À propos » incarnée, mention « validé par Didier ». Partage social (Open Graph).

**Phase 10 — Sécurité & livraison.** Audit RLS complet, anti-spam sur les formulaires, config sauvegardes. Documentation d'utilisation de l'admin. Préparer le transfert des comptes (Vercel/Supabase/Stripe) vers le client.

---

## 6. Règles d'or (non négociables)

1. **Sécurité RLS d'abord.** Chaque table a RLS **activée** dès sa création. **Jamais** de policy `USING (true)` par défaut. Politiques explicites : un praticien ne voit/modifie que **ses** données ; un participant ne voit que le public ; l'admin voit tout. La clé anon ne doit **rien** exposer de sensible.
2. **Stripe = webhooks + idempotence.** Les crédits ne sont crédités que par un webhook Stripe **vérifié par signature**, et une transaction déjà traitée (même `stripe_session_id`) n'est **jamais** comptée deux fois.
3. **Géocodage à la création du lieu** (sinon la recherche par rayon ne marche pas).
4. **Secrets** en variables d'environnement uniquement. **Jamais** de clé dans le code ou dans un commit.
5. **Commits fréquents**, messages clairs ; `PROGRESS.md` tenu à jour.
6. **Images** systématiquement redimensionnées/compressées à l'upload.
7. **Multilingue en dernier.** Ne pas tripler les contenus avant que le produit soit stabilisé en français.
8. **Placeholders marqués.** Tout élément provisoire (photo, texte, clé) est signalé par un commentaire `// PLACEHOLDER — …`.

---

## 7. Vérification par phase (à faire avant de committer la phase)

- Le build passe (`npm run build`) et le lint est propre.
- Les parcours clés de la phase fonctionnent (teste-les).
- **Contrôle RLS** : tente un accès non autorisé et vérifie qu'il est refusé.
- Note dans `PROGRESS.md` : ce qui est fait, ce qui reste, tout blocage.

---

## 8. Hors périmètre de ce build (phases futures — structure à anticiper)

Ne pas implémenter, mais laisser la place dans le schéma : **avis / notes** des praticiens · **blog** + commentaires · **réservation en ligne + commission** (modèle Retreat Guru) · **génération automatique des textes d'annonce**. La clause : *pouvoir les ajouter plus tard sans refaire l'architecture.*

---

## 9. Suivi & collaboration (Rodrigue ↔ Victor)

- **Commit + push souvent** : chaque push déclenche un déploiement preview sur le Vercel de Victor → il voit l'avancement en direct.
- Tenir **`PROGRESS.md`** à jour (état d'avancement lisible par Victor).
- Avant chaque session, lire **`REQUESTS.md`** (ou les issues GitHub) : Victor y dépose ses demandes ; tu les intègres au périmètre en cours.
- Ne jamais mentionner, dans quoi que ce soit de destiné au client, l'outillage interne de développement : tout est présenté comme le développement de l'agence.
