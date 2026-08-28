# Arbitrage — nouvelles fonctionnalités demandées par Didier (25 août 2026)

> **Arbitrage par Rodrigue, pour validation Victor.**
> Règle appliquée (Victor, 28/08) : les correctifs, on les fait. Les ajouts, uniquement
> si c'est ESSENTIEL et qu'on aurait dû y penser plus tôt. Sinon, c'est à facturer.
> Les corrections/bugs de l'email de Didier sont traitées séparément (déjà en cours).

---

## Décision : inclus (on aurait dû y penser)

### 4. Galerie / carrousel photos sur les événements

**Demande** : quand un praticien upload plusieurs photos pour un événement, elles
doivent toutes apparaître sous forme de galerie ou carrousel sur la page publique.

**Pourquoi c'est inclus** : le formulaire permet déjà d'uploader jusqu'à 6 photos,
le champ `images` (tableau) existe en base, mais seule la première photo s'affiche
sur la page publique. C'est un oubli de finition, pas une nouvelle fonctionnalité.
Si on permet l'upload de 6 photos, elles doivent toutes être visibles.

**Estimation** : 3-4h (composant carrousel responsive + navigation + adaptation mobile).

---

## Décision : à facturer

### 1. TWINT comme moyen de paiement

**Demande** : ajouter TWINT dans les moyens de paiement Stripe, enlever Amazon.

**Ce que ça implique** : activation dans le Dashboard Stripe de Didier + adaptation
code checkout. Enlever Amazon est un simple retrait côté Stripe.

**Estimation** : 1-2h.

**Pourquoi à facturer** : c'est un nouveau moyen de paiement, pas prévu dans le cahier
des charges initial. Pertinent pour la Suisse, mais c'est un ajout.

---

### 2. Remboursements depuis le back-office

**Demande** : pouvoir déclencher un remboursement directement depuis l'admin ForTheSoul,
sans aller sur Stripe.

**Ce que ça implique** : interface admin + API Stripe Refunds + logique crédits + email +
gestion des cas limites (remboursement partiel/total, crédit déjà consommé).

**Estimation** : 4-6h.

**Pourquoi à facturer** : Didier peut déjà rembourser via le Dashboard Stripe. C'est
du confort admin, pas un manque. À proposer quand le volume de remboursements le justifie.

---

### 3. Email de confirmation de paiement au praticien

**Demande** : quand un praticien achète un pack de crédits, il reçoit un email de
confirmation brandé ForTheSoul dans sa langue.

**Ce que ça implique** : envoi Resend dans le webhook Stripe, template trilingue FR/DE/EN.

**Estimation** : 2-3h.

**Pourquoi à facturer** : Stripe envoie déjà un reçu par email. L'email brandé est un
plus, pas un manque fonctionnel.

---

### 5. Traduction complète de la page admin

**Demande** : la page admin reste en français quand on passe en DE ou EN.

**Ce que ça implique** : extraction de tous les textes en dur (8 onglets), création des
clés de traduction, traduction DE/EN, test.

**Estimation** : 6-8h.

**Pourquoi à facturer** : Didier dit lui-même "pas primordial actuellement". Seul Didier
utilise l'admin, et il parle français. À proposer dans la maintenance.

---

### 6. Contacts formulaire → dashboard newsletter

**Demande** : les messages du formulaire de contact n'apparaissent pas dans le dashboard
newsletter. Didier veut les utiliser pour ses relances.

**Ce que ça implique** : checkbox consentement RGPD/nLPD dans le formulaire de contact +
insertion conditionnelle dans la table contacts + synchro MailerLite.

**Estimation** : 2-3h.

**Pourquoi à facturer** : le formulaire de contact et la newsletter sont deux outils
séparés. Les relier est un ajout fonctionnel, avec en plus une obligation légale
(consentement explicite).

---

## Récapitulatif

| # | Fonctionnalité | Estimation | Décision |
|---|---|---|---|
| **4** | **Galerie/carrousel photos** | **3-4h** | **Inclus (oubli de finition)** |
| 1 | TWINT | 1-2h | À facturer |
| 2 | Remboursements back-office | 4-6h | À facturer |
| 3 | Email confirmation paiement | 2-3h | À facturer |
| 5 | Traduction admin | 6-8h | À facturer |
| 6 | Contacts → newsletter | 2-3h | À facturer |

**Inclus (finition)** : 3-4h
**À facturer si Didier accepte** : 15-23h

Victor, jette un coup d'oeil et dis-moi si tu valides cet arbitrage.
