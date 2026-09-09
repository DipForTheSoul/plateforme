# Checklist go-live — ForTheSoul

Version candidate : branche `codex/fix-practitioner-editor-duration`, base `4610ad9`.
Date/fenêtre : contrôles du 9 septembre 2026, 18 h Europe/Paris ; aucune fenêtre de production fixée.
Responsable de décision : Rodrigue, avec propriétaire des environnements client.
Responsable rollback : à désigner avant production ; Victor reçoit les instructions de reprise.

## Périmètre et données

- [x] Périmètre du lot décrit dans REPRISE-VICTOR-2026-09-09.md.
- [x] Migrations et préservation des données testées sur laboratoire local existant.
- [ ] Copie représentative de production : accès et comparaison à effectuer.
- [x] Fixtures temporaires des tests connectés nettoyées ; fixtures manuelles restent seulement locales.
- [ ] Inventaire/nettoyage éventuel des anciennes données fictives distantes non effectué.
- [ ] Sauvegarde distante vérifiée et restauration exercée.
- [ ] Séparation Preview/Production confirmée dans Vercel.

## Sécurité et conformité

- [x] Contrôles locaux positifs/négatifs d'autorisation et stockage réussis.
- [x] Nouveaux fichiers livrés sans secrets ni export des données ; audit privé des mails exclu.
- [x] Audit dépendances : aucune alerte élevée/critique, deux modérées de développement signalées.
- [x] Limites partagées locales vérifiées.
- [ ] Révocation du secret historique confirmée par son propriétaire.
- [ ] Revue complète sécurité/conformité de la configuration réelle.

## Qualité

- [x] Lint, types, 256 tests et build optimisé réussis.
- [x] 25 contrôles base, 8 Auth et 8 HTTP locaux réussis.
- [x] Retours manuels de Rodrigue inventoriés sans assimiler les tests automatisés à sa recette.
- [ ] WCAG 2.2 AA complète et lecteurs d'écran.
- [ ] Appareils physiques/navigateurs et langues sur tous les parcours.
- [ ] Budgets performance terrain.

## Services live

- [ ] DNS/TLS/URLs de production et retours Auth vérifiés sur la version candidate.
- [ ] SPF/DKIM/DMARC et réception fournisseur d'e-mails vérifiés.
- [ ] Checkout/webhook fournisseur sur base isolée ; paiement live/remboursement uniquement après autorisation distincte.
- [ ] Newsletter et autres intégrations client vérifiées.

## Exploitation et client

- [ ] Logs/alertes/contacts de production et retour code/base validés.
- [x] Inventaire de changements, commandes et réserves transmis avec la branche.
- [ ] Guides client complets et responsabilités d'exploitation confirmés.

## Décision

**GO transmission de branche ; NO-GO bascule production.**
Preuves : rapport de reprise et tests du 9 septembre ; contrôles distants en lecture seule attestant des colonnes nécessaires absentes. Accès aux réglages Vercel non établi.
Risques acceptés : aucune acceptation implicite des bloqueurs de production.
Actions avant lancement : accès client, sauvegarde/restauration, migrations antérieures et nouvelles sur copie, Preview isolée puis tests déployés, décision explicite de bascule.
