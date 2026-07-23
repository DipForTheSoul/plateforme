# Livraison & transfert des comptes (Phase 10)

> Checklist pour transférer la plateforme des comptes de l'agence vers ceux du
> client, sans interruption.

## 1. Comptes à transférer

| Service | Action | Notes |
|---|---|---|
| **Supabase** | Organisation → Transfer project, ou inviter le client Owner puis se retirer | Les clés API ne changent pas lors d'un transfert d'organisation |
| **Vercel** | Transfer project vers le compte/équipe du client | Reconfigurer les variables d'env si nouvelle équipe |
| **Stripe** | Le client crée SON compte Stripe ; remplacer les 3 clés | Repasser en clés **live** + recréer le webhook endpoint prod |
| **Resend** | Compte au nom du client + vérification du domaine forthesoul.ch (SPF/DKIM) | Plan gratuit : 3000 e-mails/mois |
| **GitHub** | Transférer le repo ou inviter le client | |
| **Domaine forthesoul.ch** | Pointer les DNS vers Vercel (A/CNAME) | Prévoir aussi les enregistrements Resend |

## 2. Variables d'environnement de production (Vercel)

Recopier `.env.example` avec les valeurs de production. Points d'attention :
- `NEXT_PUBLIC_SITE_URL=https://forthesoul.ch` (sitemaps, e-mails, hreflang).
- `STRIPE_WEBHOOK_SECRET` : celui de l'endpoint **de production**
  (`https://forthesoul.ch/api/stripe/webhook`, événement `checkout.session.completed`).
- `SUPABASE_SERVICE_ROLE_KEY` : uniquement dans Vercel (jamais côté client).

## 3. Sauvegardes

- Supabase : Database → Backups (quotidiennes incluses). Activer la rétention
  souhaitée / PITR selon le plan.
- Export manuel possible : `supabase db dump` avant toute migration.

## 4. Contrôles avant mise en ligne

- [ ] Audit RLS (`docs/SECURITE.md`) exécuté sur le projet de production.
- [ ] Paiement test en mode live avec une vraie carte (petit montant) + remboursement.
- [ ] E-mails transactionnels reçus (dépôt, validation, refus).
- [ ] `robots.txt` et `sitemap.xml` accessibles.
- [ ] Recherche par rayon opérationnelle (les lieux de seed sont géocodés).
- [ ] Placeholders remplacés : logo, photo de Didier, IBAN, tarifs des packs.

## 5. Remise au client

- Guide admin : `docs/ADMIN.md` (à remettre à Didier).
- Accès : Supabase, Vercel, Stripe, Resend, GitHub, registrar.
- Rappel : toute la communication client présente le travail comme le
  développement de l'agence (BUILD-BRIEF.md §9).
