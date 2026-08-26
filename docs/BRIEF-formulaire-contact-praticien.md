# Brief — Formulaire de contact praticien (ForTheSoul)

> **Pour le Claude de Victor.** Résumé de la demande de Didier (26 août 2026)
> et confirmation technique de Rodrigue.

---

## Contexte

Didier constate que les visiteurs contactent les praticiens directement via
l'email affiché sur leur fiche. Problème : **il n'a aucune trace** de ces
contacts (pas de visibilité sur le trafic, pas de base de prospects).

## Ce que Didier veut

1. Que le praticien reçoive les contacts **avec une signature ForTheSoul**
   (il voit que le trafic vient de la plateforme → argument de vente).
2. Que Didier **garde une trace** de chaque contact (email du visiteur,
   praticien contacté, date) → analytics + relance possible.

## Deux options discutées

| | Formulaire de contact | Routage email via Resend |
|---|---|---|
| **Principe** | Bouton « Contacter » → mini-formulaire (nom, email, message) → enregistrement en base + email Resend au praticien signé ForTheSoul | Remplacer l'email du praticien par un alias @forthesoul, intercepter l'email entrant, le router |
| **Estimation** | **2-3 heures** | **6-8 heures minimum** |
| **Fiabilité** | Très fiable (on contrôle tout) | Fragile (parsing d'emails, codes supprimés, chaînes de réponse) |
| **Maintenance** | Quasi nulle | Élevée |

## Confirmation technique (Rodrigue)

**Le formulaire est beaucoup plus rapide à développer** et fait exactement
la même chose du point de vue du visiteur. Didier a validé cette approche
dans son dernier vocal.

Victor a raison sur l'estimation : **2-3h pour le formulaire**, le double
(voire plus) pour le routage email.

## Périmètre

**Hors scope du projet actuel** (heures max atteintes). À estimer comme
fonctionnalité séparée. Peut s'inscrire dans les 5h de parrainage si
l'ami de Didier passe à l'action.

## Ce que ça implique techniquement (pour quand on le fera)

- Nouvelle table `practitioner_contacts` (avec RLS : insert public,
  lecture admin uniquement)
- Formulaire sur la page praticien (remplace le lien email direct)
- Server action : validation + insertion en base + envoi Resend
- Template email « Contact via ForTheSoul » (signature brandée)
- Vue admin pour Didier (liste des contacts, filtres par praticien/date)
- L'email du praticien **n'est plus visible** publiquement (bonus sécurité/RGPD)

## Autres demandes de Didier (même conversation)

- **Parrainage** : Didier a transmis les contacts WixFactory à un ami →
  5h offertes (parrain + filleul). Victor a déjà répondu.
- **Marketing / Google Ads** : Didier veut discuter budget et stratégie
  de lancement. À traiter séparément (Victor ou mise en relation).
