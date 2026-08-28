# Process « Plateforme sur-mesure » — retour d'expérience (projet ForTheSoul)

> **Ce document, pour qui et pour quoi.** C'est le **récit fidèle et complet** de la
> façon dont on a réalisé la plateforme **ForTheSoul** (Didier) avec Claude — **toutes les
> étapes, dans l'ordre**, y compris celles qu'on **ne fait pas** sur un site Wix classique.
>
> **But** : servir de **matière première au Claude de Victor** pour qu'il **propose**
> comment intégrer ce déroulé dans notre CRM interne **« confiance »** (là où on pilote
> les clients et les projets), en **adaptant** le process de livraison qu'on a déjà pour
> les **sites Wix** à ce **nouveau type de projet : les plateformes sur-mesure**.
>
> ⚠️ **Ce n'est pas un cahier des charges à exécuter tel quel.** Reste **large**. Le Claude
> de Victor doit **proposer** des intégrations et **poser des questions à Victor** avant de
> décider quoi que ce soit. **C'est Victor qui valide** in fine ce qui entre dans « confiance »
> et sous quelle forme. Adapter à l'**ADN de chaque nouveau projet** (tout n'est pas toujours
> présent — voir §3, modules conditionnels).
>
> **Périmètre** : concerne **la partie plateforme** (dev sur-mesure avec Claude), donc
> **Rodrigue + Victor uniquement**, sur **nos comptes**. À **dissocier des sites Wix**. Le
> client garde un **espace de suivi** (comme pour les sites Wix) mais **adapté** (voir §4).

---

## 0. Note au Claude de Victor — comment te servir de ce doc

- **Lis-le comme un déroulé réel**, pas comme une norme figée.
- **Propose** : « voici comment on pourrait mapper ça dans confiance / dans l'espace client ».
- **Demande à Victor** : intégration oui/non, sous quelle forme, quels jalons il veut voir.
- **Deux niveaux de lecture** (voir §2 et §4) :
  - **Côté dev (Rodrigue + Victor)** : juste **l'ordre des choses**.
  - **Côté client (espace de suivi)** : **détaillé, pas-à-pas** — le client **ne connaît rien**, il faut tout lui dérouler.
- **Modularité** : tout projet n'a pas tous les outils. Active/désactive les modules selon
  l'ADN du projet (ex. pas de paiement → pas de Stripe ; e-mails de relance → MailerLite).
- **Ta mission prioritaire** : d'abord **comprendre le concept de l'espace « plateforme »
  (ou « dev »)** — voir juste en dessous — puis **proposer à Victor comment intégrer toute
  cette notion de plateforme dans « confiance »** (avant même le reste). Le **§8** liste
  précisément les **propositions attendues de ta part** (formulaire, cahier des charges,
  flux de retouches, stratégie, maintenance). Sur chacune : **propose, pose des questions,
  Victor tranche.**

### Le concept « espace plateforme / dev » (à saisir avant de proposer)
On a, à l'agence, un process rodé pour livrer des **sites Wix** (formulaire client, fiche
client, espace de suivi, aperçus, demandes de retouches page par page…). On veut le **même
esprit et la même puissance**, mais pour un **nouveau type de livrable : les plateformes
sur-mesure** (dev avec Claude), qui vit dans un **espace à part** (« plateforme » / « dev »)
**réservé à Rodrigue + Victor**. Ce n'est **pas** un site Wix : il y a des étapes en plus
(§1), d'autres outils (§3), d'autres dépendances (§5). Le client, lui, garde un **espace de
suivi** semblable à ce qu'il connaît pour les sites Wix, **mais adapté**. Ton rôle : **relier
ces deux mondes** — reprendre ce qui marche déjà (Wix) et l'**adapter** aux plateformes, dans
« confiance ».

---

## 1. Ce qui change par rapport à un site Wix (les étapes « en plus »)

Sur une plateforme sur-mesure, on ajoute au process Wix habituel :

- **Un vrai back-end** : base de données, authentification, rôles, **sécurité (RLS)**.
- **Un hébergement applicatif** (Vercel) au lieu de l'éditeur Wix.
- **Des intégrations tierces branchées par nous** (paiement, e-mails, newsletter, analytics, cartes).
- **Deux environnements** : **test** puis **production** (surtout pour le paiement).
- **Le domaine + les e-mails côté DNS** (pas juste « pointer le domaine » : SPF/DKIM pour les e-mails).
- **Une revue de sécurité finale** (audit du code par un expert avant livraison).
- **Un espace client/praticien** avec logique métier (crédits, publications, etc.).

👉 Ces étapes n'existent pas (ou peu) sur un site Wix → **c'est là qu'il faut enrichir le process** de « confiance ».

---

## 2. Le déroulé — l'ordre des étapes (côté DEV : Rodrigue + Victor)

Version concise, **« l'ordre des choses comme elles se passent »**. Chaque phase a une
**porte de sortie** (à valider avant de passer à la suite).

| # | Phase | En bref | Porte avant la suite |
|---|---|---|---|
| 0 | **Cadrage & ADN** | Périmètre, formule, cahier des charges. Ce qui est inclus vs prochaine version. | Périmètre signé |
| 1 | **Fondations** | Repo Git, stack (Next.js + Tailwind + Supabase), schéma DB, **RLS dès la création des tables** (voir §2.3), hébergement Vercel, i18n si multilingue. | Base + auth qui tournent + **matrice RLS initiale validée** |
| 2 | **Fonctionnalités** | Développement par phases (auth/rôles → CRUD → découverte/recherche → espaces → …). **Chaque nouvelle table = RLS + policies immédiatement** (voir §2.3). | Chaque phase testée + **test RLS par table** |
| 3 | **Comptes tiers & intégrations** | Brancher les **modules conditionnels** (§3). ⚠️ **Demander les comptes au client TÔT** (pas à la fin). | Clés en place (ou en attente listée) |
| 4 | **Contenus & i18n** | Textes, images, traductions FR/DE/EN. Surveiller les **textes en dur** sur les pages publiques. | Contenus intégrés |
| 5 | **Recette** | Tests de bout en bout. **Paiement en mode test** avant le live. **Audit sécurité complet** (voir §2.4). | Parcours validés + **audit sécurité 100 % vert** |
| 6 | **Mise en ligne** | **Domaine** → puis services **live** (Stripe live + webhook, e-mails SMTP + Resend). | Prod vérifiée |
| 7 | **Livraison & suite** | Doc admin, **PDF guide client**, suppression comptes de test, **revue sécurité finale post-prod** (§2.5), garantie 3 mois, offre de maintenance. | Client autonome |

**Règle de séquence clé** : *le domaine conditionne les e-mails et le Stripe live.* Donc le
**rendez-vous de mise en ligne** cumule souvent : **domaine + Stripe live + e-mails + livraison**.

### 2.1 Chemin critique des dépendances (à ne jamais promettre à l'envers)
```
Domaine relié  →  Vérif DNS (SPF/DKIM)  →  { E-mails (Resend + SMTP Supabase)  +  Stripe live }
```
⚠️ **Ne jamais dire « ça marche déjà » avant le domaine** : les e-mails et le paiement réel
en dépendent. Avant le domaine, on **teste** (mode test) — on ne livre pas.

### 2.2 Porte de mise en ligne (Definition of Done — 100 % vert obligatoire)
Rien ne part en prod tant que **tout** n'est pas coché :
- [ ] Domaine relié + `NEXT_PUBLIC_SITE_URL` sur le domaine
- [ ] Stripe **live** (clés + webhook sur le domaine) + **test avec une vraie carte** (petit montant)
- [ ] E-mails : Resend + SMTP Supabase branchés, **un e-mail réel reçu** (inscription/confirmation)
- [ ] **Comptes de test supprimés** + mots de passe changés
- [ ] **Médias lourds compressés** (vidéo hero…)
- [ ] **Sécurité : audit complet 100 % vert** (voir §2.4 — matrice RLS, rate-limit, service role, API)
- [ ] **Doc admin** rédigée + remise au client
- [ ] Textes publics **traduits** (pas de texte en dur si multilingue)
- [ ] **Middleware i18n** : routes `/auth/*` et `/api/*` exclues du matcher (pas de 404 sur la confirmation e-mail)
- [ ] **Templates e-mails Supabase** personnalisés (logo, couleurs marque, texte clair) dans le Dashboard
- [ ] **Test inscription bout en bout en prod** : formulaire → e-mail reçu (vérifier spams) → clic lien → compte actif
- [ ] **Variables d'env Vercel** : noms exacts, pas de doublons, clé Resend valide
- [ ] **DMARC DNS** ajouté (`_dmarc.domaine → v=DMARC1; p=none; ...`)
- [ ] **PDF guide client** remis (doc d'utilisation de la plateforme, personnalisé au projet)

### 2.3 Sécurité RLS — matrice de référence (Phase 1 → Phase 2)

> **Règle absolue : aucune table ne doit exister sans RLS activé + au moins une policy.**
> Cette matrice est à remplir **à chaque création de table** et à **re-vérifier à chaque
> nouvelle fonctionnalité**. C'est le socle de sécurité de la plateforme.

#### Matrice RLS complète — ForTheSoul (référence pour les projets futurs)

| Table | SELECT | INSERT | UPDATE | DELETE | Garde-fous supplémentaires |
|---|---|---|---|---|---|
| **profiles** | Son propre profil ou admin | — | Son propre profil ou admin | — | Trigger `prevent_role_escalation` : seul l'admin peut changer un rôle |
| **practitioners** | Approuvés = public ; les siens ou admin | Authentifié (statut `pending`, 0 crédits) | Les siens ou admin | Admin seul | Trigger `guard_practitioner_sensitive_fields` : `status` et `credits` protégés |
| **venues** | Public (catalogue) | Créateur ou admin | Créateur ou admin | Admin seul | — |
| **categories** | Public (référentiel) | Admin seul | Admin seul | Admin seul | — |
| **events** | Approuvés = public ; les siens ou admin | Propriétaire (statut `pending`, `is_top=false`) ou admin | Propriétaire ou admin | Propriétaire ou admin | Trigger `guard_event_sensitive_fields` : `status` et `is_top` protégés |
| **favorites** | Admin seul (analytics) | Anon + auth (`visitor_id` longueur 8-64) | — | Anon + auth (scopé par `visitor_id`) | Source de vérité = localStorage client |
| **contacts** | Admin seul | Anon + auth (`consent=true`) | Admin seul | Admin seul | — |
| **credit_transactions** | Propriétaire ou admin | Admin seul (webhook = service role) | — | — | `stripe_session_id` UNIQUE = idempotence |
| **page_views** | Admin seul | Anon + auth (`path` ≤ 200 car.) | — | — | Rate-limit applicatif sur l'API |
| **reviews** | Public | Authentifié (`user_id=auth.uid()`, event approuvé, limites de longueur) | — | — | Index unique `(user_id, event_id)` = 1 avis par user par event |
| **event_categories** | Aligné sur la visibilité de l'événement | Propriétaire de l'event ou admin | Idem | Idem | — |
| **settings** | Clés d'affichage publiques ; le reste = admin | Admin seul | Admin seul | — | Allowlist de clés côté application |
| **credit_packs** | Propriétaire ou admin | Admin seul | Admin seul | — | — |
| **contact_messages** | Admin seul | Public (longueur `name` 1-200, `email` 5-320, `message` 10-5000, `handled=false`) | Admin seul | — | Honeypot + rate-limit applicatif (5/min/IP) |
| **storage.objects** (bucket `images`) | Public (bucket public) | Auth dans son propre dossier (`<user_id>/...`) | Auth dans son propre dossier | Auth dans son dossier ou admin | MIME types restreints (jpeg/png/webp), max 5 MB |

#### Règles RLS à appliquer systématiquement sur tout nouveau projet

1. **`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`** dès le `CREATE TABLE` — dans la même migration.
2. **Jamais de `USING(true)` sauf contenu explicitement public** (catalogue, référentiel). Toujours justifier en commentaire SQL.
3. **Triggers de garde** sur les champs sensibles (statut, rôle, crédits) — la RLS autorise l'UPDATE, le trigger bloque les champs interdits.
4. **Service role** (`SUPABASE_SERVICE_ROLE_KEY`) uniquement côté serveur, protégé par `import "server-only"`. Jamais dans le client.
5. **Migration filet de sécurité** (`0015_enforce_rls_all_tables.sql`) : à inclure dans tout projet — vérifie dynamiquement qu'aucune table n'a été oubliée.
6. **1 avis par utilisateur par événement** (index unique) pour éviter le spam d'avis.
7. **Validation de longueur dans les policies INSERT** pour les formulaires publics (empêche l'abus direct via PostgREST).

### 2.4 Audit de sécurité complet — checklist pré-mise en ligne (Phase 5)

> **À exécuter à la fin de la phase 5 (Recette), AVANT la mise en ligne.**
> Chaque point doit être vert. Tout point rouge bloque le go-live.

#### A. RLS & Base de données

| # | Vérification | Comment tester | Statut |
|---|---|---|---|
| A1 | **Toutes les tables ont RLS activé** | `SELECT tablename FROM pg_tables WHERE schemaname='public'` → vérifier `relrowsecurity=true` pour chacune | ☐ |
| A2 | **Chaque table a au moins 1 policy** | `SELECT tablename, policyname FROM pg_policies WHERE schemaname='public'` | ☐ |
| A3 | **Pas de `USING(true)` injustifié** | Grep dans les migrations : chaque `USING(true)` a un commentaire `-- justifié :` | ☐ |
| A4 | **Lecture avec clé anon** (curl) | `curl -H "apikey: ANON_KEY" "URL/rest/v1/TABLE?select=*"` pour chaque table sensible → doit renvoyer `[]` ou erreur | ☐ |
| A5 | **Escalade de privilèges** | Tenter de modifier `role` (profiles), `status` (practitioners/events), `credits` (practitioners) avec un JWT utilisateur → doit échouer | ☐ |
| A6 | **Idempotence paiement** | Rejouer un webhook Stripe avec le même `stripe_session_id` → pas de doublon de crédits | ☐ |
| A7 | **Pas d'injection SQL** | Vérifier : aucun template literal dans les requêtes, tout passe par le query builder ou des fonctions RPC | ☐ |

#### B. Application & API

| # | Vérification | Comment tester | Statut |
|---|---|---|---|
| B1 | **Service role non exposé au client** | Grep `SUPABASE_SERVICE_ROLE_KEY` : uniquement dans des fichiers avec `import "server-only"` | ☐ |
| B2 | **Auth sur chaque route API** | Vérifier que chaque `app/api/` protégé a un `getUser()` + check de rôle | ☐ |
| B3 | **Auth sur chaque server action admin** | Chaque action dans `app/actions/` qui modifie des données a `assertAdmin()` ou `getCurrentPractitioner()` | ☐ |
| B4 | **Validation Zod sur tous les formulaires** | Chaque server action qui reçoit du FormData utilise un schéma Zod | ☐ |
| B5 | **Rate-limit sur les endpoints publics** | Newsletter, contact, inscription, reset password, page views : `isRateLimited()` appelé | ☐ |
| B6 | **Pas de redirect ouvert** | Vérifier que les paramètres `next` dans les redirections commencent par `/` et ne peuvent pas pointer vers `//` | ☐ |
| B7 | **CSRF protégé** | Toutes les mutations passent par des Server Actions Next.js (protection CSRF native) | ☐ |

#### C. Secrets & Configuration

| # | Vérification | Comment tester | Statut |
|---|---|---|---|
| C1 | **Seules les clés `NEXT_PUBLIC_` sont exposées côté client** | Grep `process.env` dans les fichiers client → uniquement `NEXT_PUBLIC_*` | ☐ |
| C2 | **Variables d'env Vercel complètes** | Comparer `.env.example` avec les variables Vercel en production | ☐ |
| C3 | **Webhook Stripe signé** | Le handler vérifie `stripe.webhooks.constructEvent` avec `STRIPE_WEBHOOK_SECRET` | ☐ |
| C4 | **Middleware protège les routes sensibles** | `/espace-praticien/*` et `/admin/*` redirigent vers `/connexion` sans session | ☐ |

#### D. Stockage

| # | Vérification | Comment tester | Statut |
|---|---|---|---|
| D1 | **Upload scopé au dossier utilisateur** | Tenter d'uploader dans le dossier d'un autre utilisateur → doit échouer | ☐ |
| D2 | **Types MIME restreints** | Tenter d'uploader un `.exe` ou un `.html` → doit échouer | ☐ |
| D3 | **Taille max respectée** | Tenter d'uploader un fichier > 5 MB → doit échouer | ☐ |

### 2.5 Revue de sécurité post-production (Phase 7)

> **À exécuter après la mise en ligne, avant la livraison au client.**
> C'est le dernier filet avant de remettre les clés.

- [ ] **Re-exécuter l'audit §2.4 sur l'instance de production** (pas seulement en dev/test)
- [ ] **Vérifier les alertes Supabase** : Dashboard → Advisors → Security → aucune alerte `rls_disabled_in_public`
- [ ] **Tester avec une vraie clé anon de prod** (pas celle de dev)
- [ ] **Supprimer tous les comptes de test** dans `auth.users` et `practitioners`
- [ ] **Changer les mots de passe** des comptes admin créés pendant le dev
- [ ] **Vérifier les logs Supabase** : pas d'erreurs 500 récurrentes, pas de requêtes suspectes
- [ ] **Documenter la matrice RLS finale** dans `docs/SECURITE.md` (fait automatiquement si on suit §2.3)

---

## 3. Les modules conditionnels (outils) — inclure selon le projet

Le Claude de Victor active/désactive selon l'ADN du projet. Ceux **utilisés et validés** sur ForTheSoul :

| Module | Inclure si… | Ce que le client fournit | Points d'attention |
|---|---|---|---|
| **Hébergement — Vercel** | Toujours | Rien (notre compte, ou le sien) | Déploie à chaque push ; l'e-mail d'auteur des commits doit être « valide » sinon build bloqué |
| **Base + Auth — Supabase** | Toujours | Rien | **RLS activée dès le départ** (§2.3), jamais `USING(true)` sans justification. **Migration filet de sécurité** obligatoire |
| **Paiement — Stripe** | Le projet vend qqch | **Créer un compte Stripe** + **activer** (infos entreprise + **IBAN réel**) + **nous inviter en rôle Developer** | **Managed Payments** activé par défaut : ajoute la TVA + exige un `tax_code` → **décider la taxe tôt** (prix tout compris vs Stripe Tax). Pricing **dynamique** (`price_data`) = **prix éditables à 1 seul endroit (admin)**, pas de produit Stripe à synchroniser |
| **E-mails transactionnels — Resend** | E-mails applicatifs (confirmations, notifications) | **Créer un compte Resend** + nous donner les codes | **Dépend du domaine** (vérif DNS SPF/DKIM). Sans clé → e-mails en console seulement |
| **E-mails d'auth/connexion — SMTP custom (via Resend)** | Il y a des **comptes utilisateurs** | (idem Resend) | ⚠️ Le service e-mail **par défaut de Supabase est bridé** (quelques envois/h) → **SMTP custom obligatoire** pour de vraies inscriptions. **Dépend aussi du domaine** |
| **Newsletter — MailerLite** | Newsletter / relances marketing | **Créer un compte MailerLite** + nous donner les codes / clé API | **Ne gère PAS le transactionnel** (ça, c'est Resend/Supabase). Synchro à l'inscription newsletter |
| **Analytics — Google Analytics** | Suivi d'audience | Propriété GA4 + ID `G-XXXX` | S'active seul si l'ID est fourni |
| **Cartes — OpenStreetMap / Nominatim** | Lieux / géo / itinéraires | Rien | **Gratuit, sans clé** (choix par défaut). Google Maps = **API payante** → seulement si le client le veut et paie |
| **Domaine — registrar / DNS** | Toujours (mise en ligne) | **Nous dire le registrar** (ou accès) | Rattachement par **CNAME / A**, **pas TXT** (TXT = seulement vérification de propriété). Prévoir la **propagation DNS** (quelques min → quelques heures) |

---

## 4. Face CLIENT — l'espace de suivi (détaillé, pas-à-pas)

Le client **ne connaît rien** : il faut tout lui dérouler, **dans l'ordre**, avec un **aperçu**
à chaque étape (comme pour les sites Wix). Adapter le suivi « confiance » avec ces étapes.

### 4.1 Règle d'accès aux comptes (nouvelle façon de faire)
- Le client **crée un Gmail dédié au projet** et nous **donne les codes**.
- Avec ce Gmail, il **crée tous les comptes nécessaires** (ceux qu'il n'a pas déjà) et **utilise le même mot de passe partout**.
- Il nous **donne les codes d'accès** → **on se connecte directement** (plus d'invitations à gérer).
- **Exceptions où l'invitation reste obligatoire** :
  - **Stripe** → nous **inviter en rôle Developer** (dans les 2 cas : compte existant ou nouveau).
  - Quand une invitation est **nécessaire pour brancher notre Claude / un outil**.
- **S'il a déjà des comptes / API ailleurs** → il nous **donne les accès**.

### 4.2 Ce que le client fournit, dans l'ordre (checklist « on continue ! »)
1. **Accès aux comptes** (Gmail dédié + codes), selon les modules du projet (§3).
2. **Paiement (si applicable)** : compte Stripe créé + **activé** (IBAN réel) + invitation Developer.
3. **E-mails (si applicable)** : compte **Resend** créé + codes.
4. **Newsletter (si applicable)** : compte **MailerLite** + codes.
5. **Analytics (si applicable)** : ID GA4.
6. **Domaine** : registrar / accès (ou on lui envoie les lignes DNS à coller).
7. **Contenus** : textes, photos, vidéos, **texte juridique des CGV** (fourni par lui / son juriste).
8. **Décisions** : liste finale des catégories, tarifs, choix de la taxe, etc.

### 4.3 Ce que le client voit / valide (aperçu)
- Une **version de test** avant la mise en ligne (dernier tour).
- Un **rendez-vous de mise en ligne** (domaine + paiement live + e-mails + livraison).
- Après livraison : **garantie 3 mois** sur les anomalies + **offre de maintenance** (petites modifs, nouvelles idées) sans engagement.

> Note utile à transmettre au client : la plateforme fonctionne **sans cookies de suivi**
> → **pas de bannière de consentement** (avantage réel). N'exonère pas des CGV.

---

## 5. Points d'attention — là où ça a bloqué (à ne PAS reproduire)

Tirés du projet réel ForTheSoul :

1. **E-mails = dépendants du domaine.** Impossible d'envoyer de vrais e-mails avant d'avoir vérifié le domaine (DNS). → **Demander le compte Resend TÔT** dans le process, pas à la fin.
2. **Inscriptions qui ne partent pas** = service e-mail Supabase par défaut bridé. → **SMTP custom** obligatoire ; le prévoir dès qu'il y a des comptes utilisateurs.
3. **Stripe Managed Payments** : ajoute la TVA automatiquement (ex. 20 % France) + exige un code fiscal. → **Trancher la taxe tôt** (prix tout compris vs Stripe Tax), c'est une décision **client/compta**.
4. **Prix éditables** : grâce au pricing dynamique, le client change ses prix **à un seul endroit (son admin)** — **ne pas** faire croire qu'il faut aussi aller sur Stripe.
5. **Domaine** : c'est du **CNAME/A**, pas du TXT. Ne pas partir sur une vérif TXT pour « faire pointer » le site.
6. **Discipline de périmètre** : distinguer **finitions incluses** (texte, bouton, alignement) des **nouvelles briques** (nouveau module → arbitrage/chiffrage). Éviter de coder au jugé sur une demande floue → **demander une capture annotée**.
7. **Demander TOUS les comptes tiers au bon moment** (début/milieu), sinon ça bloque la mise en ligne.
8. **Toujours tester le paiement en mode test** avant le live (carte `4242…`).
9. **i18n** : surveiller les **textes en dur** sur les pages publiques (boutons, libellés) → tout passer en clés FR/DE/EN.
10. **Avant prod** : supprimer les **comptes de test**, changer les mots de passe, **compresser les médias lourds** (vidéo hero), **re-tester la sécurité (RLS)**, rédiger la **doc admin**.
11. **Revue de sécurité finale** par un expert après la mise en ligne.
12. **Rendez-vous client** : régler ses **réglages visio** (salle d'attente Zoom, etc.) — un participant qui entre trop tôt peut entendre l'interne. Détail, mais soigne l'image « pro ».
13. **Conformité — selon le PAYS du client** (pris dans la fiche client, pas « toujours la Suisse » : on a des clients belges, français, etc.). Adapter : **nLPD** (Suisse), **RGPD** (UE/Belgique/France…). Page **CGV/mentions légales** = incluse, mais **contenu juridique fourni par le client** (jamais rédigé par nous). Rappeler l'avantage **sans cookies** (pas de bannière) + **région de la base de données** (données en Europe).
14. **⚠️ SMTP Supabase — configuration exacte (incident ForTheSoul 2026-08-22).** Le SMTP custom dans Supabase **doit** utiliser les paramètres Resend suivants : `smtp.resend.com`, port `587`, username `resend`, password = **la clé API Resend** (la même que `RESEND_API_KEY`). Si la clé est invalide/expirée, Supabase renvoie un **status 500 « Error sending confirmation email »** (`AuthRetryableFetchError`) → l'inscription **semble marcher** côté front mais **aucun e-mail ne part**. → **Toujours tester une vraie inscription après avoir branché le SMTP** (pas juste vérifier que la config est sauvegardée). Si ça casse en prod : **régénérer la clé Resend** et la coller dans Supabase SMTP Password + dans Vercel `RESEND_API_KEY`.
15. **⚠️ Middleware i18n vs routes d'auth (incident ForTheSoul 2026-08-22).** Le middleware `next-intl` (ou tout middleware i18n) intercepte **toutes** les routes par défaut, y compris `/auth/callback` → le clic de confirmation e-mail redirige vers `/fr/auth/callback` → **404**. → **Dès la mise en place de l'auth**, exclure `/auth` du matcher du middleware : `matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"]`. **Vérifier en cliquant le lien de confirmation** (pas juste en testant le formulaire d'inscription).
16. **Templates e-mails Supabase = configuration manuelle dans le Dashboard.** Les templates d'e-mails d'authentification (confirmation d'inscription, reset de mot de passe, magic link, etc.) ne sont **pas gérés par le code** — ils se configurent **uniquement dans le Supabase Dashboard** (Authentication → Email Templates). → **Les personnaliser avec le branding du client** (logo, couleurs, style) **avant la mise en ligne**. Le preview dans le Dashboard ne charge pas les images externes (normal) — tester avec un vrai envoi.
17. **Cohérence visuelle de TOUS les e-mails.** Deux systèmes d'e-mails coexistent : (1) **Supabase Auth** (templates Dashboard) et (2) **Resend API** (templates dans le code, `lib/email-templates.ts`). → **Utiliser le même style visuel** sur les deux : logo en haut, carte blanche, bouton aux couleurs de la marque, footer cohérent. Ne pas livrer avec des e-mails « bruts » Supabase et des e-mails « stylés » Resend.
18. **E-mails en spam — nouveau domaine.** Les premiers e-mails d'un nouveau domaine finissent souvent en **spam** (Gmail, Hotmail…). C'est **normal** et temporaire. → **Avertir le client** + ajouter un **message « vérifiez vos spams »** sur la page de confirmation d'inscription. Ajouter un **enregistrement DMARC** dans le DNS (`_dmarc.domaine.ch → v=DMARC1; p=none; ...`) pour améliorer la délivrabilité.
19. **Test de bout en bout de l'inscription AVANT livraison.** Ne pas se contenter de vérifier que le formulaire s'affiche et que l'API répond 200. → **Tester le parcours complet** : inscription → e-mail reçu (vérifier la boîte + les spams) → clic sur le lien de confirmation → redirection OK → compte actif. Ce test doit être fait **en prod** (pas juste en local), **avec une vraie adresse e-mail externe** (pas une adresse @domaine-du-projet).
20. **⚠️ Alerte Supabase « rls_disabled_in_public » (incident ForTheSoul 2026-08-26).** Même si toutes les migrations incluent `ENABLE ROW LEVEL SECURITY`, Supabase peut alerter si une migration n'a pas été exécutée ou si une table a été créée manuellement via le Dashboard. → **Toujours inclure la migration filet de sécurité** (`0015_enforce_rls_all_tables.sql`) qui force RLS sur toutes les tables + vérifie dynamiquement les oublis. → **Vérifier dans le Dashboard Supabase** : Advisors → Security → 0 alerte.
21. **⚠️ Formulaires publics : le rate-limit applicatif ne suffit pas seul (audit ForTheSoul 2026-08-26).** Les policies RLS `WITH CHECK(true)` sur les tables à insertion publique (`contact_messages`, anciennement `reviews`) permettent à un attaquant d'insérer directement via l'API REST Supabase (clé anon), en contournant le honeypot et le rate-limit du server action. → **Toujours ajouter des contraintes de validation dans la policy RLS elle-même** (longueur des champs, valeurs par défaut forcées) en plus du rate-limit applicatif. Double couche = sécurité réelle.
22. **⚠️ Rate-limit sur TOUS les endpoints publics (audit ForTheSoul 2026-08-26).** L'endpoint `/api/views` (analytics) n'avait pas de rate-limit → un attaquant pouvait inonder la table `page_views`. → **Systématiquement appeler `isRateLimited()` sur tout endpoint public** (pas seulement les formulaires).

---

## 6. Boîte à outils — les listes demandées

### 6a. Les points « .md » qui cadrent un projet (documents de pilotage)
- **ADN / brief projet** (positionnement, objectifs, périmètre, formule).
- **Cahier des charges** (phases, modèle de données, règles d'or : RLS, idempotence paiement…).
- **Doc « à fournir par le client »** (comptes, contenus, décisions) — la checklist du §4.
- **Doc d'arbitrage de périmètre** (inclus vs prochaine version / à chiffrer) pour Victor.
- **Suivi d'avancement** (ce qui est fait / reste / bloqué) — lisible par le client et par Victor.
- **Note de reprise technique (handoff)** (état, comptes, ports, DB, points chauds).
- **Doc de livraison** (checklist mise en ligne) + **doc admin** (comment utiliser le back-office).
- **PDF guide client** — document personnalisé remis au client à la livraison : prise en main de la plateforme, accès admin, gestion des contenus, FAQ. **À produire systématiquement** pour chaque nouveau projet plateforme.
- **Doc sécurité** (matrice RLS §2.3 + audit §2.4 + revue post-prod §2.5).

### 6b. Skills à ajouter (pour fiabiliser/accélérer ces plateformes)
- **Skill « cadrage plateforme »** : à partir de l'ADN, sortir le périmètre + les **modules à activer** (§3) + les comptes à demander.
- **Skill « checklist mise en ligne »** : générer la séquence domaine → e-mails → paiement live, adaptée au projet.
- **Skill « intégration paiement (Stripe) »** : Checkout + webhook signé/idempotent + gestion Managed Payments/taxe + prix éditables.
- **Skill « e-mails »** : Resend + SMTP Supabase + DNS (SPF/DKIM), avec l'ordre de dépendance au domaine.
- **Skill « RLS / sécurité »** : matrice par table (§2.3) + audit complet (§2.4) + migration filet de sécurité + durcissement des policies publiques.
- **Skill « i18n »** : détecter les textes en dur et les passer en clés multilingues.
- **Skill « revue de périmètre »** : classer une demande client (finition incluse / nouvelle brique / arbitrage).
- **Skill « doc client »** : générer l'espace de suivi (à fournir + aperçu) façon « confiance ».

### 6c. Outils du marché à envisager (selon les projets)
- **Auth/DB/back** : Supabase (utilisé), alternatives Clerk/Auth.js, Neon/PlanetScale.
- **Hébergement** : Vercel (utilisé), Netlify, Railway/Render, Cloudflare.
- **Paiement** : Stripe (utilisé), + Revolut (paiement manuel/QR utilisé en secours) ; Lemon Squeezy/Paddle (MoR, gèrent la TVA à ta place — intéressant pour la question taxe).
- **E-mails** : Resend (utilisé) ; alternatives Postmark, Loops, Brevo.
- **Newsletter** : MailerLite (utilisé) ; Brevo, Mailchimp.
- **Analytics sans cookie** : GA4 (utilisé) ; Plausible, Umami (encore plus « sans bannière »).
- **Cartes** : OpenStreetMap/Nominatim (utilisé, gratuit) ; Google Maps (payant), Mapbox.
- **Recherche** : Postgres/PostGIS (utilisé) ; Meilisearch/Typesense/Algolia si recherche avancée.
- **Média** : compression vidéo/images (à systématiser), Cloudinary/Mux si beaucoup de média.
- **Sécurité** : revue de code + rate-limit/anti-spam (utilisés) ; monitoring (Sentry).

---

## 7. À intégrer dans « confiance » — les propositions attendues (de ta part)

> Cœur de ta mission. Sur **chaque** point ci-dessous : **fais des propositions** à Victor,
> **pose-lui des questions**, et **c'est lui qui tranche**. C'est **différent des sites Wix**,
> donc n'applique rien tel quel — **adapte** et **propose**. Principe transverse : **tout
> appartient au client** (comptes à son nom).

### 7.0 Un enchaînement logique (chaque décision de Victor déclenche la suite)
**Tout doit s'enchaîner dans l'ordre.** Chaque **décision / choix de Victor** fait **découler
naturellement** la proposition suivante — rien n'arrive hors séquence. Le Claude de Victor
**ne propose l'étape suivante qu'une fois la précédente tranchée**, et adapte ce qu'il affiche
en fonction de ce qui a été décidé avant.

```
Formulaire plateforme (7.1)
  → ADN + modules à activer + comptes à demander (§3)
    → Propositions stratégiques de fonctionnalités (7.4)      [Victor affine / choisit]
      → RDV Victor ↔ client
        → Cahier des charges généré, reçu par Rodrigue (7.2)  [Victor valide le périmètre]
          → Développement : phases (§2) + modules retenus (§3)
            → [Phase 1] Fondations + matrice RLS initiale (§2.3)
            → [Phase 2] Fonctionnalités + RLS par table ajoutée
            → [Phase 5] Audit sécurité complet (§2.4)
              → Aperçu + retouches page par page (7.3)          [validation client, géré par Rodrigue]
                → Porte go-live (§2.2) → mise en ligne (§6)
                  → [Phase 7] Revue sécurité post-prod (§2.5)
                    → Livraison + proposition de maintenance sur-mesure (7.5)
```

À chaque flèche, la décision de Victor **conditionne la suite** (ex. modules retenus → cahier
des charges adapté → dev adapté → go-live adapté). C'est ce **fil logique** qui doit structurer
l'intégration dans « confiance ».

### 7.1 Un formulaire « plateforme » dédié (séparé du formulaire Wix)
On a **déjà** un formulaire/questionnaire client pour les sites Wix — mais il **n'est pas
adapté** aux plateformes. → **Développer un formulaire séparé**, dans le même esprit mais
**adapté** (ce n'est pas la même chose). Il doit faire sortir l'**ADN du projet + les modules
à activer** (paiement ? comptes utilisateurs ? newsletter/relances ? cartes ? multilingue ? …)
et la **liste des comptes à demander** (§3). **Propose** à Victor où et comment l'intégrer.

### 7.2 Génération du cahier des charges (après le RDV Victor ↔ client)
Après le **rendez-vous de Victor avec le client**, l'IA peut **générer le cahier des charges**
— qui **pose toutes les questions utiles, dans l'ordre** — et que **Rodrigue reçoit dans son
espace, sur le projet client**. **Propose** à Victor : **où** le placer dans « confiance »,
**comment** le structurer, et le **lien avec le formulaire** (7.1). Différent des sites Wix →
**propose plusieurs options**, Victor choisit.

### 7.3 Flux de retouches / aperçu (comme Wix, mais adapté plateforme)
Sur les sites Wix, au moment des **retouches**, le client **navigue de page en page** et
**demande des rectifications** (avec aperçu). On veut **le même système**, **adapté aux
plateformes**, et **géré par Rodrigue** (pas les cheffes de projet / designers). → **Propose**
comment reproduire ce parcours « aperçu + demande de rectification page par page » pour un
projet plateforme (techniquement différent d'un site Wix).

### 7.4 Propositions stratégiques de fonctionnalités (avant le RDV client)
Dans la **stratégie** de la plateforme, Victor a déjà des **propositions générées par l'IA**
(fonctionnalités qui pourraient être ajoutées), **cadrées dans la stratégie**, **après le
formulaire** et **avant** qu'il prépare son RDV client. → **Important** : ton Claude Code doit
lui **poser davantage de questions sur ce sujet** pour affiner et cadrer ces propositions
avant le rendez-vous. (Voir aussi les **repères d'estimation** ci-dessous.)

### 7.5 Maintenance sur-mesure (fin de projet)
À **chaque fin de projet** : une **proposition de maintenance**, d'abord **validée**,
**généralement similaire mais adaptée** au projet et au client (maintenance **sur-mesure**),
que **le client n'a qu'à accepter**. → Ton Claude fait **les propositions** de maintenance
adaptées au projet.

### 7.6 Repères d'estimation (pour aider Victor à chiffrer)
Pour chaque module/demande, indiquer si c'est **typiquement inclus** (finition) ou **à
chiffrer** (nouvelle brique). Exemples réels ForTheSoul : mise en avant **self-service** ≈ 600 € ;
**mini-CMS** (éditer prix/textes soi-même) ≈ 2-3 h ; auto-délistage ≈ inclus. → Aide Victor à
**répondre vite** en RDV : inclus / prochaine version / à chiffrer.

### 7.7 Triage systématique des demandes client post-livraison

**Contexte.** Après la livraison, le client envoie des demandes (par email, groupe de
discussion, téléphone). Certaines sont des **corrections** (ça devait marcher, ça ne marche
pas), d'autres sont des **nouvelles fonctionnalités** (ça n'a jamais été prévu). Il faut un
système de tri automatique pour ne pas mélanger les deux.

**Règle générale.** Chaque demande client reçue après livraison passe par ce filtre :

| Critère | Classification | Action |
|---|---|---|
| Le comportement est décrit dans le cahier des charges et ne fonctionne pas | **Correction / bug** | Rodrigue corrige directement, sans validation Victor |
| Le comportement fonctionne mais pas exactement comme le client l'imaginait (UX, wording, couleur) | **Ajustement mineur** | Rodrigue corrige si < 30 min, sinon → Victor |
| Le client demande quelque chose qui n'existe pas dans le cahier des charges | **Nouvelle fonctionnalité** | Rodrigue chiffre (estimation en heures), Victor décide du tarif et de la priorité |
| Le client demande un changement d'architecture ou de stack | **Évolution majeure** | Victor arbitre avant tout chiffrage |

**Processus concret :**

1. **Le client envoie ses demandes** (email, message, liste de points).
2. **Rodrigue trie** chaque point dans un document structuré (`.md` ou tableau) :
   - Colonne 1 : demande du client (résumé)
   - Colonne 2 : classification (correction / ajustement / nouvelle fonctionnalité / évolution)
   - Colonne 3 : estimation (pour les nouvelles fonctionnalités uniquement)
   - Colonne 4 : note technique (ce que ça implique)
3. **Les corrections** → Rodrigue les traite directement (c'est de la garantie).
4. **Les nouvelles fonctionnalités** → document d'arbitrage envoyé à Victor, qui décide :
   quoi proposer au client, sous quelle forme, à quel tarif.
5. **Victor revient au client** avec la proposition chiffrée pour le hors-cadre.

**Pourquoi c'est important.** Sans ce tri, on risque soit de travailler gratuitement sur des
fonctionnalités hors cahier des charges, soit de bloquer des corrections légitimes en
attendant une validation inutile. Le tri protège à la fois l'agence (pas de travail gratuit)
et le client (ses bugs sont corrigés vite).

**Exemple réel (ForTheSoul, août 2026).** Didier envoie un email avec 16 points. Après tri :
10 corrections (garantie, traitées directement) et 6 nouvelles fonctionnalités (TWINT,
remboursements back-office, email confirmation, galerie photos, traduction admin, contacts
newsletter — total estimé 18-27h, document d'arbitrage envoyé à Victor).

**Intégration dans « confiance ».** Ce triage devrait être un **outil standard** dans l'espace
plateforme : un formulaire ou template où Rodrigue colle les demandes du client et les classe.
Le Claude de Victor peut **proposer** comment intégrer ce flux dans le suivi projet (tableau de
bord des demandes post-livraison, avec statut par point : corrigé / en attente d'arbitrage /
chiffré / accepté par le client / développé).

---

## 8. Mémo final — pour le Claude de Victor

- **Ce doc = matière première.** Ta mission : **proposer** comment l'intégrer à **« confiance »**
  (pilotage interne) **et** à l'**espace client** (suivi), en t'appuyant sur ce qui existe déjà
  pour les **sites Wix** et en l'**adaptant** aux **plateformes sur-mesure**.
- **Reste large et laisse le champ libre.** Ne fige rien : fais des **propositions**.
- **Pose des questions à Victor** avant d'intégrer (quoi, où, sous quelle forme, quels jalons).
- **C'est Victor qui valide.**
- **Dissocie des sites Wix** : c'est du sur-mesure, sur les comptes **Rodrigue + Victor**.
- **Garde la modularité** : chaque nouveau projet réactive/désactive les modules selon son ADN.
- **La sécurité n'est pas un « à la fin »** : elle se construit **à chaque étape** (§2.3 matrice
  RLS dès Phase 1, §2.4 audit en Phase 5, §2.5 revue post-prod en Phase 7). Le Claude de Victor
  doit **intégrer ces jalons sécurité dans le suivi « confiance »** comme des portes obligatoires.
