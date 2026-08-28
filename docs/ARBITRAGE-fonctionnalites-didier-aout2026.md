# Arbitrage — nouvelles fonctionnalités demandées par Didier (25 août 2026)

> **Arbitrage par Rodrigue (délégation Victor).**
> Règle appliquée (Victor, 28/08) : les correctifs, on les fait. Les ajouts, uniquement
> si c'est ESSENTIEL et qu'on aurait dû y penser plus tôt. Sinon, c'est à facturer.
> Les corrections/bugs de l'email de Didier sont traitées séparément (déjà livrés).

---

## Décision : inclus (on aurait dû y penser / logique)

### 4. Galerie / carrousel photos sur les événements — FAIT

**Demande** : quand un praticien upload plusieurs photos pour un événement, elles
doivent toutes apparaître sous forme de galerie ou carrousel sur la page publique.

**Pourquoi c'est inclus** : le formulaire permet déjà d'uploader jusqu'à 6 photos,
le champ `images` (tableau) existe en base, mais seule la première photo s'affichait.
C'est un oubli de finition, pas une nouvelle fonctionnalité.

**Estimation** : 3-4h. **Statut : livré.**

---

### 5. Traduction complète de la page admin — FAIT

**Demande** : la page admin reste en français quand on passe en DE ou EN.

**Ce qui a été fait** : extraction de ~130 chaînes en dur de 20 fichiers admin,
création des clés de traduction dans les 3 langues (FR/DE/EN), conversion de tous
les composants serveur et client pour utiliser next-intl.

**Pourquoi c'est inclus** : la plateforme est trilingue de bout en bout, l'admin
doit l'être aussi. C'est de la cohérence, pas un ajout.

**Estimation** : 6-8h. **Statut : livré.**

---

### 6. Contacts formulaire → dashboard newsletter — FAIT

**Demande** : les messages du formulaire de contact n'apparaissent pas dans le
dashboard newsletter. Didier veut les utiliser pour ses relances.

**Ce qui a été fait** : checkbox consentement RGPD/nLPD dans le formulaire de
contact + insertion conditionnelle dans la table contacts + synchro MailerLite.

**Pourquoi c'est inclus** : c'est logique que les contacts ayant donné leur
consentement soient intégrés à la base newsletter. La checkbox RGPD est une
obligation légale qui aurait dû être pensée dès le départ.

**Estimation** : 2-3h. **Statut : livré.**

---

## Décision : à facturer

### 1. TWINT comme moyen de paiement — FAIT (inclus dans les corrections)

**Demande** : ajouter TWINT dans les moyens de paiement Stripe, enlever Amazon.

**Ce qui a été fait** : `payment_method_types: ["card", "twint"]` dans le checkout.
Didier doit encore activer TWINT dans son Dashboard Stripe.

**Note** : initialement classé "à facturer", mais finalement livré car c'est une
ligne de code dans le checkout existant. Didier doit cependant activer TWINT
dans Stripe Dashboard > Paramètres > Moyens de paiement.

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

## Récapitulatif

| # | Fonctionnalité | Estimation | Décision | Statut |
|---|---|---|---|---|
| **4** | **Galerie/carrousel photos** | **3-4h** | **Inclus** | Livré |
| **5** | **Traduction admin FR/DE/EN** | **6-8h** | **Inclus** | Livré |
| **6** | **Contacts → newsletter** | **2-3h** | **Inclus** | Livré |
| 1 | TWINT | 1h | Inclus (corrections) | Livré |
| 2 | Remboursements back-office | 4-6h | À facturer | — |
| 3 | Email confirmation paiement | 2-3h | À facturer | — |

**Inclus et livré** : ~13-16h de travail
**À facturer si Didier accepte** : 6-9h
