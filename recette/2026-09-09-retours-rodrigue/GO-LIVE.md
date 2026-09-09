# Checklist go-live — ForTheSoul

## État actualisé — 9 septembre 2026, 18 h 52 CEST

La version applicative **74ca626 est en production et sur main**, à la demande de Rodrigue. Le détail des preuves et les limites figurent en tête de `REPRISE-VICTOR-2026-09-09.md`. La checklist initiale ci-dessous reste l'état historique de préparation, et non une certification globale de tous les services.

- [x] Accès réels et association Supabase/Vercel vérifiés.
- [x] Sauvegarde chiffrée réelle, Auth/Storage compris, restauration isolée exercée.
- [x] Onze migrations répétées sur copie, puis transaction atomique en production avec assertions de conservation des anciennes données et soldes.
- [x] Build production prêt avant promotion ; domaines publics vérifiés ; push normal main effectué et CI réussie.
- [x] Tests de transactions/droits/récurrences/crédits en production intégralement annulés par ROLLBACK.
- [x] Connexion, dépôt privé de série et modification tarifaire par navigateur sur le domaine public ; crédit unique vérifié ; fixture dédiée supprimée par identifiants exacts.
- [x] Pages publiques, locales et barrières d'accès HTTP vérifiées ; absence d'erreurs dans la fenêtre de logs interrogée.
- [x] Build de retour compatible `4610ad9` préparé ; sauvegarde et procédure de restauration distinctes.
- [ ] Certification paiement live/webhook, réception fournisseurs de mails/newsletter : non effectuée ; aucun paiement réel déclenché.
- [ ] Isolation des variables Preview/Production : partage existant identifié, aucun test destructif à lancer sur Preview.
- [ ] Révocation historique, revue conformité/accessibilité exhaustive et exploitation durable : réserves non levées par ce déploiement.

**Décision constatée : mise à jour applicative déployée et smoke tests réussis ; ne pas présenter cela comme une certification exhaustive de la plateforme.** Aucun reset, seed, effacement générique de données ou changement de clés/DNS.

## Checklist initiale conservée pour traçabilité

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
