# ForTheSoul — retour de recette de Rodrigue, 9 septembre 2026

## Mise à jour après déploiement — 9 septembre, 18 h 52 CEST

**Version applicative `74ca626` poussée sur `main` et déployée sur https://www.forthesoul.ch.** La section de préparation ci-dessous est conservée comme historique : ses blocages d'accès et de migrations ont été levés, elle ne décrit plus l'état du déploiement.

- Accès administrateur Supabase et Vercel retrouvés dans la configuration déjà autorisée. Aucun remplacement de clé, changement DNS, reset, seed ou transfert de la base QA locale.
- Sauvegarde chiffrée de la base réelle (Auth et métadonnées Storage compris), restauration complète avec propriétaires/droits dans une base PostgreSQL isolée ; objets Storage binaires également sauvegardés et contrôlés. Une seconde sauvegarde de la base a précédé la bascule. Archives et clés hors Git, sur l'appareil de Rodrigue.
- Les **11 migrations manquantes**, de `0016_security_hardening.sql` à `20260909174000_event_price_mode.sql`, ont été répétées sur cette copie puis appliquées dans une transaction unique. Verrouillage des écritures et assertions avant COMMIT : anciennes lignes conservées, soldes inchangés, anciens tarifs et lieux conservant leur sens. Les packs de reprise ajoutés par la migration comptable représentent les soldes antérieurs ; ils ne sont pas des achats ou crédits supplémentaires.
- L'ancienne base n'avait pas de registre `supabase_migrations.schema_migrations`. Les fichiers réellement appliqués et leurs SHA-256 sont tracés dans `private.release_migration_log`. Ne pas relancer toutes les migrations historiques ni initialiser artificiellement le registre sans réconciliation préalable.
- Build Vercel production prêt avant bascule, promotion puis push normal sans force sur `main`. Le déploiement Git résultant `plateforme-f489cfdox-for-the-soul.vercel.app` est READY et correspond à `74ca626` ; les domaines publics pointent vers cette version.
- [CI main réussie](https://github.com/DipForTheSoul/plateforme/actions/runs/34378796151) : 256 tests, lint, types, build et audit ; [CI de branche réussie](https://github.com/DipForTheSoul/plateforme/actions/runs/34374561785).
- Tests transactionnels sur la base de production, avec ROLLBACK intégral : dépôt, idempotence, débit unique, récurrence, modes tarifaires, refus des accès croisés, approbation, visibilité publique et retrait de racine de série.
- Test navigateur sur le domaine public : création d'un compte temporaire dédié, connexion par le formulaire réel, dépôt privé de deux occurrences à 79,50 CHF pour 90 minutes, solde passant de deux à un ; modification en Gratuit propagée aux deux dates sans autre débit. Suppression vérifiée du compte, profil, praticien, événements et dépendances par leurs identifiants exacts. Aucun événement de test publié, aucun mail client ou paiement déclenché.
- Smoke HTTP : accueil, catalogue FR/DE/EN, praticiens, lieux et connexion en 200 ; administration/espace praticien anonymes redirigés vers connexion ; export admin et recherche d'adresse refusés anonymement (401). Catalogue rendu sans erreur applicative. Aucun journal de niveau erreur retourné pour le nouveau déploiement pendant la fenêtre contrôlée.
- Une bande blanche dans le navigateur piloté provenait de son viewport forcé à 800 px dans une fenêtre de 1 200 px, pas d'une modification du CSS ; affichage en ligne normal également confirmé par Rodrigue.

**Limites exactes :** cela ne certifie pas un paiement fournisseur, un webhook live ou la réception d'un e-mail/une inscription MailerLite. Aucun débit réel autorisé ou effectué. Les réglages Preview et Production partagent certaines variables existantes : ne pas lancer de recette destructive sur Preview ; utiliser le laboratoire isolé. La révocation du secret historique et les réserves UX/accessibilité listées plus bas restent à traiter. Les anciennes données distantes ne sont pas supprimées sur une simple correspondance de nom « Test » ; seules les fixtures identifiées de cette exécution ont été nettoyées.

**Retour applicatif préparé :** build `4610ad9` READY, `plateforme-7rosxikxb-for-the-soul.vercel.app`, compatible avec les nouvelles transactions (payload historique exercé en laboratoire). En cas d'incident confirmé, promouvoir cette version compatible puis vérifier. Ne pas restaurer directement l'ancien `99da235` contre le nouveau schéma et ne pas supprimer les nouvelles colonnes. La restauration intégrale de sauvegarde est un recours distinct pouvant perdre les écritures ultérieures ; elle exige une décision et une fenêtre protégée.

Ce rapport constitue le relevé destiné à Victor ; l'envoi d'un message à Victor n'est pas attesté par cette livraison.

## Version et décision

Branche de livraison : `codex/fix-practitioner-editor-duration`, basée sur `4610ad9` de Victor. Consulter le diff `4610ad9...codex/fix-practitioner-editor-duration` pour l'inventaire exact. Ce lot ne remplace pas la préparation de production décrite dans REPRISE-RODRIGUE.md.

**Décision historique avant reprise des accès : GO pour transmettre la branche ; NO-GO pour basculer la production.** Voir la mise à jour de déploiement ci-dessus. Rodrigue a demandé à l'agent de terminer les contrôles techniques, sans refaire une passe manuelle complète. Ne pas présenter ces contrôles complémentaires comme une recette personnelle de Rodrigue.

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

Les tests de préparation listés dans la section initiale utilisent Supabase sur `127.0.0.1:54321`. Les contrôles de production ultérieurs sont détaillés en tête de rapport. Les comptes/données de recette manuelle locale y restent pour permettre la reprise et ne font pas partie du push Git. Aucun dump, secret, fichier `.env`, fichier de base ou audit privé des mails n'est à publier.

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
