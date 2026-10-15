# Mise en ligne — carte et filtres, 15 octobre 2026

Version candidate : branche `codex/tablet-catalogue-resilience-20261015`, issue de `fe29b7ba91bdadb0a69bb994f1e1a20446378836`.
Autorisation : Rodrigue demande explicitement la publication le 15 octobre 2026.
Responsable de publication et retour arrière : Codex, pour Rodrigue.

## Périmètre et données

- [x] Carte, sélection et remise à zéro des filtres ; aucune migration ni mutation de données.
- [x] Tests sur API locale synthétique ; aucun compte ou contenu de test ajouté en production.
- [x] Modifications utilisateur antérieures exclues du commit.
- Sauvegarde/restauration de base : pas modifiée ni recertifiée pour cette livraison frontend.

## Contrôles applicables

- [x] Revue du diff, encodage des contenus de carte et conservation des permissions existantes.
- [x] 329 tests unitaires, lint, types et build local réussis.
- [x] 88 scénarios navigateur, puis 11 contrôles tactiles après dernier réglage du zoom.
- [x] WebKit, Chromium et Firefox ; mobiles/tablettes émulés, orientations et bureau.
- [x] Sans JavaScript, scripts bloqués, hydratation retardée, réseau lent, rotation, historique et tuiles indisponibles.
- [ ] CI et audits GitHub de la version candidate réussis.
- [ ] Déploiement de production réussi avec SHA exact identifié.
- [ ] Contrôles publics de carte, sélection et réinitialisation réussis après publication.

Auth/RLS, paiements, newsletters, e-mails, DNS, abonnements et schéma : inchangés et hors périmètre de cette livraison. Aucun audit général WCAG ou sécurité revendiqué. Les limites des appareils physiques et du fournisseur cartographique figurent dans `RECETTE-CATALOGUE-2026-10-15.md`.

## Retour arrière

Dernière version de production vérifiée : `fe29b7ba91bdadb0a69bb994f1e1a20446378836`, déploiement GitHub `7050900021`, état `success`. En cas de régression critique, rétablir ce déploiement ou annuler uniquement le commit de cette livraison. Aucune restauration de données n'est nécessaire pour annuler ces changements.

## Décision

Publication autorisée ; fusion conditionnée aux contrôles CI. Vérification du domaine public à effectuer immédiatement après déploiement. Ne pas interpréter la recette locale comme une preuve de production.
