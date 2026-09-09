# ForTheSoul — retour de recette de Rodrigue, 9 septembre 2026

## Version et décision

Branche de livraison : `codex/fix-practitioner-editor-duration`, basée sur `4610ad9` de Victor. Consulter le diff `4610ad9...codex/fix-practitioner-editor-duration` pour l'inventaire exact. Ce lot ne remplace pas la préparation de production décrite dans REPRISE-RODRIGUE.md.

**GO pour transmettre la branche ; NO-GO pour basculer la production.** Rodrigue a demandé à l'agent de terminer les contrôles techniques, sans refaire une passe manuelle complète. Ne pas présenter ces contrôles complémentaires comme une recette personnelle de Rodrigue.

Contrôle distant en lecture seule le 9 septembre vers 18 h (Europe/Paris) : la base configurée dans le projet local d'origine renvoie `42703` pour `events.external_url`, `events.price_mode` et `venues.review_status`. L'OpenAPI n'expose ni `save_event_transaction` ni `take_request_slot`. L'association exacte de cette base aux environnements Vercel reste à confirmer : la page des réglages du projet client affiche « Not Found » dans la session disponible. Aucun réglage distant ni aucune donnée distante n'a été modifié.

## Changements strictement compris dans ce lot

1. **Description** : éditeur visuel gras/italique/souligné/listes/liens/emojis, état actif des commandes, sérialisation Markdown sûre et restauration des brouillons. Titre inchangé, sans mise en forme.
2. **Durée** : sélecteurs heures/minutes, conversion serveur en minutes, compatibilité avec les anciens brouillons en heures décimales ; durée horaire masquée pour plusieurs jours.
3. **Brouillon d'expérience** : carte visible dans « Mes expériences », reprise du nouveau brouillon local, conservation sept jours et isolation par praticien.
4. **Lieu** : suggestions d'adresses suisses, sélection clavier, saisie manuelle sans coordonnées obligatoire, traitement de panne et adresse à vérifier avec l'événement. Route authentifiée, limitée et sans mise en cache des recherches. Un nouveau lieu praticien reste privé jusqu'à validation admin de l'événement ; les lieux existants restent approuvés.
5. **Administration** : dates/heures complètes début-fin et jours calendaires inclusifs dans les soumissions ; liens « Retour aux soumissions » en haut et en bas de l'édition.
6. **Récurrences** : une carte par série dans l'accueil, le catalogue et sa vue carte ; prochaine occurrence pertinente après filtrage ; pastille « Récurrent · X dates ». Regroupement par identifiant de série, jamais par titre. Les autres dates restent accessibles sur la fiche. Pas de doublon entre une série mise en avant et les prochaines expériences de l'accueil.
7. **Tarifs** : choix explicite Gratuit / Prix libre / Prix fixe, montant positif obligatoire pour le prix fixe. Les données historiques conservent leur sens : montant positif = fixe, zéro = prix libre, absent = prix non renseigné, jamais gratuit par défaut. Propagation dans les séries, affichage cartes/fiche/carte et données structurées. Conservation des centimes à l'affichage au lieu d'un arrondi à l'unité.
8. **Traductions et tests** : nouvelles chaînes FR/DE/EN et tests de régression associés. Deux migrations et un vérificateur de préservation des données exclusivement local.

Pas de modification des intégrations Stripe/Resend/MailerLite, du DNS, des clés distantes, de la configuration Vercel ou du workflow GitHub. Pas de copie de base locale vers le serveur. Les demandes historiques hors de ces huit points ne sont pas annoncées comme livrées.

## Tests exécutés sur la version candidate

- `npm run check` : lint, types et **256 tests / 43 fichiers réussis**, 9 septembre vers 18 h.
- `node scripts/qa.mjs build` : compilation optimisée réussie ; serveur local redémarré avec ce build.
- `node scripts/qa.mjs verify` : **25 contrôles connectés réussis** : droits croisés, crédits concurrents/idempotence, stockage, PostGIS et limites partagées. Fixtures temporaires de l'exécution supprimées.
- `node scripts/qa.mjs auth` : **8 contrôles réussis** : confirmation réelle via Mailpit et callback Next, langue, récupération et changement de mot de passe. Compte temporaire supprimé ; messages fictifs conservés dans Mailpit local.
- `node scripts/qa.mjs web` : **8 contrôles HTTP réussis** : pages, voisins simultanés, agenda, suivi et anti-spam. Compte/événements/vues temporaires supprimés.
- `node scripts/qa-price-migration.mjs` : comparaison des lignes existantes avant/après migration locale ; aucune perte dans événements, praticiens, profils, lieux ou transactions. Le premier passage de migration ajoute le mode et met à jour l'horodatage technique des événements. Nouveau passage final sans migration restante : valeurs préservées.
- Navigateur de contrôle séparé : accueil et catalogue regroupés, pastille 4 dates, ancien prix absent affiché « Prix non renseigné », filtre du 17 septembre sélectionnant la bonne occurrence, choix de tarif obligatoire et montant désactivé avant sélection d'un prix fixe.
- `npm audit --audit-level=high` : succès, aucune alerte élevée/critique ; deux alertes modérées liées à Vitest/@vitest/mocker (outil de développement), non corrigées par une mise à niveau majeure automatique.
- `git diff --check` : réussi.

La confirmation, récupération et messagerie Mailpit ci-dessus sont locales : ce ne sont pas des envois par les fournisseurs du client. Checkout et webhook Stripe restent couverts par tests simulés, pas par un paiement fournisseur réalisé sur ce lot.

## Confirmations manuelles de Rodrigue

Captures et confirmations reçues : édition de description/durée ; séjour du 11 septembre 11 h au 13 septembre 16 h ; modifications/relecture ; retrait successif de dates et conservation du crédit ; modification du profil ; séparation des comptes ; blocage puis déblocage du nouveau praticien après validation ; correction d'adresse et géocodage ; publication et affichage public ; itinéraire ; préremplissage Google Calendar et Mail ; favoris ; dépublication absente du catalogue ; pastille « Récurrent · 4 dates » visible.

L'agenda et le mail ont été préremplis, pas enregistrés/envoyés. Le dernier changement de tarif n'a pas été rejoué personnellement par Rodrigue : preuve automatisée uniquement. Ne pas déduire de ces captures une validation exhaustive mobile, accessibilité ou services live.

## Données et ordre de déploiement impératif

Les tests de cette session utilisent exclusivement Supabase sur `127.0.0.1:54321`. Les comptes/données de recette manuelle y restent pour permettre la reprise. Ils ne font pas partie du push Git. Aucun dump, secret, fichier `.env`, fichier de base ou audit privé des mails n'est à publier.

Deux nouvelles migrations :

- `20260909145000_venue_event_review.sql` : statut de validation des lieux, droits de lecture et approbation liée à celle de l'événement.
- `20260909174000_event_price_mode.sql` : mode tarifaire, reprise sémantique des prix existants, contrainte et transaction de sauvegarde adaptée.

Ces migrations supposent **toutes les migrations antérieures de la branche Victor**, notamment transactions/crédits/limites partagées et lien externe. Ne pas appliquer seulement les deux dernières à l'aveugle. Aucun reset ou seed n'est ajouté au déploiement ; le workflow GitHub ne fait que les vérifications, le build et l'audit des dépendances.

Avant production :

1. Confirmer projet Vercel, base Production, base Preview isolée et accès administrateur. Ne pas tester des données fictives sur une Preview pointant vers Production.
2. Vérifier une sauvegarde restaurable de la vraie base, avec Auth/Storage selon le périmètre, et relever les identifiants/comptages avant migration. Le contrôle local n'est pas une sauvegarde du client.
3. Comparer l'historique distant des migrations ; exercer l'ensemble manquant sur copie isolée et vérifier données/crédits/séries/droits. Prévoir une fenêtre protégeant les écritures des anciennes versions et onglets.
4. Appliquer uniquement les migrations manquantes puis le code compatible ; conserver une version et une procédure de retour compatibles avec le schéma. Ne pas supprimer les nouvelles colonnes pour revenir en arrière ; un retour à un code pré-transaction n'est pas un rollback validé.
5. Vérifier sur l'environnement déployé : inscription/connexion, édition/dépôt et crédit unique, relecture/publication, fichiers, récurrences/tarifs, e-mails et Stripe test/webhook. Contrôler logs et erreurs avant autorisation de production ; paiement live éventuel séparément autorisé.
6. Inventorier les éventuelles anciennes données fictives distantes par identifiants et dépendances avant tout nettoyage. Aucun effacement générique par nom « Test », domaine d'e-mail ou reset de base. Une telle suppression n'a pas été réalisée dans ce lot.

## Points restants explicitement non corrigés

- Extraits Markdown bruts dans l'administration.
- Filtre tarifaire encore libellé en CHF lorsque l'affichage des cartes est en EUR ; vue carte utilisant le prix de base.
- Solde de crédits non ajouté à la page d'édition praticien.
- Une dépublication affiche encore « Refusée » (état partagé existant).
- Revue appareils physiques, accessibilité complète et performances terrain non effectuée dans ce lot.
- Révocation du secret historique mentionné dans AUDIT-2026-09-07.md à confirmer par le propriétaire ; aucune valeur recopiée ici.

Ces réserves ne doivent pas être présentées comme résolues lors de l'envoi à Didier.
