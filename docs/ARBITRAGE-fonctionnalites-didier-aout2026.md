# Arbitrage — nouvelles fonctionnalités demandées par Didier (25 août 2026)

> **Pour Victor.** Ces demandes sont hors périmètre initial, ce sont des nouvelles
> fonctionnalités. À toi de décider lesquelles on propose à Didier, sous quelle forme
> et à quel tarif. Les corrections/bugs de son email sont traitées séparément par Rodrigue.

---

## 1. TWINT comme moyen de paiement

**Demande** : ajouter TWINT dans les moyens de paiement Stripe, enlever Amazon.

**Ce que ça implique** : TWINT est disponible via Stripe en Suisse, il faut l'activer dans
le Dashboard Stripe de Didier (Payment methods) et adapter le code du checkout pour
l'inclure dans les `payment_method_types`. Enlever Amazon est un simple retrait côté Stripe.

**Estimation** : 1-2h (activation Stripe + adaptation code checkout + test).

**Note** : TWINT est très utilisé en Suisse, c'est pertinent pour sa cible.

---

## 2. Remboursements depuis le back-office

**Demande** : pouvoir déclencher un remboursement directement depuis l'admin ForTheSoul,
sans aller sur Stripe.

**Ce que ça implique** : créer une interface admin avec un bouton "Rembourser" sur chaque
transaction, appeler l'API Stripe Refunds, gérer les crédits en retour (annuler la
consommation ou pas), envoyer un email de confirmation au praticien.

**Estimation** : 4-6h (interface admin + API Stripe Refunds + logique crédits + email +
gestion des cas limites : remboursement partiel ou total, crédit déjà consommé).

**Note** : actuellement Didier peut rembourser directement via le Dashboard Stripe.
La question est de savoir si ça vaut le coup de dupliquer ça dans l'admin ForTheSoul
ou si le Dashboard Stripe suffit pour le volume actuel.

---

## 3. Email de confirmation de paiement au praticien

**Demande** : quand un praticien achète un pack de crédits, il reçoit un email de
confirmation dans SA langue.

**Ce que ça implique** : ajouter un envoi Resend dans le webhook Stripe (après l'ajout
des crédits), avec un template traduit FR/DE/EN, en récupérant la langue préférée du
praticien depuis son profil.

**Estimation** : 2-3h (template email trilingue + envoi dans le webhook + test).

**Note** : Stripe envoie déjà un reçu par email. La valeur ajoutée ici c'est un email
brandé ForTheSoul avec le détail des crédits ajoutés.

---

## 4. Galerie / carrousel photos sur les événements

**Demande** : quand un praticien upload plusieurs photos pour un événement, elles
doivent toutes apparaître sous forme de galerie ou carrousel sur la page publique.

**Ce que ça implique** : le champ `images` (tableau) existe déjà en base et le formulaire
permet déjà d'uploader plusieurs photos. Il faut créer un composant carrousel/galerie
sur la page événement publique (actuellement seule la première image est affichée).

**Estimation** : 3-4h (composant carrousel responsive + navigation + miniatures +
adaptation mobile).

**Note** : le stockage et l'upload fonctionnent déjà. C'est uniquement l'affichage
côté public qui manque.

---

## 5. Traduction complète de la page admin

**Demande** : la page admin reste en français quand on passe en DE ou EN. Didier dit
que ce n'est pas prioritaire mais que ça pourrait servir un jour.

**Ce que ça implique** : passer tous les libellés de l'interface admin (onglets, boutons,
titres, messages) en clés i18n FR/DE/EN. L'admin a environ 8 onglets avec des formulaires.

**Estimation** : 6-8h (extraction de tous les textes en dur, création des clés de
traduction, traduction DE/EN, test de chaque onglet).

**Note** : Didier dit lui-même "pas primordial actuellement". À proposer en option ou
dans la maintenance. Aujourd'hui seul Didier utilise l'admin, et il parle français.

---

## 6. Contacts formulaire → dashboard newsletter

**Demande** : les messages reçus via le formulaire de contact public n'apparaissent pas
dans le dashboard newsletter. Didier veut pouvoir utiliser ces contacts pour ses relances.

**Ce que ça implique** : quand un message de contact est reçu, créer automatiquement
une entrée dans la table `contacts` (newsletter) avec le nom et l'email du visiteur,
et un tag source `contact-form`. Ajouter un consentement newsletter dans le formulaire
de contact (checkbox "Je souhaite recevoir les actualités ForTheSoul").

**Estimation** : 2-3h (ajout checkbox consentement + insertion conditionnelle dans
la table contacts + synchro MailerLite si activé).

**Note** : attention RGPD/nLPD, il faut un consentement explicite pour ajouter quelqu'un
à une newsletter. On ne peut pas ajouter automatiquement tous les contacts sans leur accord.

---

## Récapitulatif

| # | Fonctionnalité | Estimation | Priorité suggérée |
|---|---|---|---|
| 1 | TWINT | 1-2h | Haute (standard en Suisse) |
| 2 | Remboursements back-office | 4-6h | Moyenne (Dashboard Stripe suffit pour le moment) |
| 3 | Email confirmation paiement | 2-3h | Moyenne |
| 4 | Galerie/carrousel photos | 3-4h | Haute (attendu par les praticiens) |
| 5 | Traduction admin | 6-8h | Basse (Didier dit lui-même pas prioritaire) |
| 6 | Contacts → newsletter | 2-3h | Moyenne (attention consentement RGPD) |

**Total si tout est retenu : 18-27h**

À toi de voir ce qu'on propose à Didier, dans quel ordre, et si certaines rentrent
dans les 5h de parrainage (si son ami passe à l'action).
