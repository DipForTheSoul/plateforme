# ForTheSoul — reprise par Rodrigue et son IA

État transmis le 9 septembre 2026. Commencer ici avant les anciens rapports.

## Point de reprise

**Le développement du dernier lot et sa recette locale sont terminés. Le travail restant est la préparation de l’environnement client, la recette connectée puis la bascule coordonnée en production.** Une prévisualisation compilée n’est pas la preuve que sa base est compatible.

| Repère | Valeur vérifiée lors de la transmission |
| --- | --- |
| Dépôt client | [DipForTheSoul/plateforme](https://github.com/DipForTheSoul/plateforme) |
| Branche à reprendre | `codex/audit-parcours-20260907` |
| Dernier commit applicatif testé | `7fba0906328f10e857eb73baa430fbed9aefa146` |
| Prévisualisation de ce commit | [plateforme-izr2bnk8x-for-the-soul.vercel.app](https://plateforme-izr2bnk8x-for-the-soul.vercel.app) |
| Vercel du client | Équipe `for-the-soul`, projet `plateforme` |
| Contrôles GitHub de ce commit | [Réussis](https://github.com/DipForTheSoul/plateforme/actions/runs/34271507671) |
| Production | `main` était à `99da235` ; ni `main` ni le site public n’ont été modifiés par cette livraison |

La prévisualisation est protégée par la connexion Vercel du client. La session de Victor ne dispose pas de cet accès, ni de l’accès permettant d’administrer le Supabase client. Ses comptes cloud connectés concernent d’autres projets : aucun projet en double n’a été créé. La configuration et les migrations de la base distante restent **à vérifier**, pas présumées appliquées.

Ce fichier peut recevoir un commit documentaire après `7fba090`. Reprendre le dernier état de la branche, en conservant ce commit applicatif dans son historique. Vérifier les références distantes au moment de la reprise : les valeurs ci-dessus sont un état daté, pas un verrou sur le travail ultérieur.

## Ce qui est déjà traité

- Brouillons d’expérience, profil et lieu : persistance locale, restauration, abandon confirmé, isolation par compte/objet et protection des conflits entre onglets.
- URL saisies naturellement sans `https://`, validation des liens et sauvegarde sûre.
- Horaires suisses, durée saisie en heures, séries modifiables après publication, dates libres, suppression d’une seule date y compris la première, crédits et sauvegardes transactionnels.
- Demandes du dernier email Didier : mobile, bouton Créer le lieu violet, aide dans la récurrence, durée horaire masquée en mode plusieurs jours, deux dates/heures affichées, jours calendaires inclusifs, éditeur de description et lien externe dédié.
- Éditeur léger : gras, italique, souligné, listes, liens, huit emojis et aperçu. **Le titre reste simple et les marqueurs restent visibles pendant l’édition de la description** ; ce n’est pas un traitement de texte complet.
- Anomalies supplémentaires reproduites puis corrigées : deuxième suppression bloquée par un faux brouillon, italique retirant le gras, en-tête trop large, filtres rapides qui s’écrasent et conflit Liste/Carte avec le calendrier.

Les deux patches de Rodrigue (`4437221` et `6c8e787`) ont été reçus et comparés. Leurs besoins sont pris en compte, sans réintroduire la suppression/recréation non transactionnelle des séries. **Ne pas les appliquer à nouveau aveuglément.** Voir la section « Informations récupérées des patches » du [rapport brouillons](recette/2026-09-08-brouillons/RAPPORT.md).

Preuves du dernier lot : **192 tests automatisés réussis**, dont 31 SQL ; compilation, lint et typage réussis ; 25 contrôles connectés locaux, 8 Auth et 8 HTTP réussis. Des parcours ont aussi été réellement effectués dans le navigateur intégré de Victor avec administrateur et praticien : erreurs, changement de langue, photo, récurrences, suppression, public, favoris, agenda, carte et panne serveur réelle pendant le dépôt. La reprise du formulaire après cette panne a réussi avec un seul crédit débité.

Ces preuves sont locales. Elles ne certifient ni les services distants du client, ni toutes les fonctionnalités historiques, ni l’absence de bugs.

## Étape 1 — récupérer sans écraser le travail de Rodrigue

1. Vérifier le dépôt, les modifications locales et les branches avant toute opération.
2. Sauvegarder le travail local de Rodrigue sur sa propre branche/commit si nécessaire. Récupérer les références distantes, puis examiner `codex/audit-parcours-20260907` dans un checkout propre ou un worktree distinct.
3. Comparer les changements récents de Rodrigue et `main` avec cette branche. Conserver les changements utiles des deux côtés ; ne pas remplacer le projet par l’ancien dossier `Forthesoul` de Victor.
4. Lire `AGENTS.md`. Avant toute modification Next.js, lire les guides pertinents de la version installée dans `node_modules/next/dist/docs/`.

**Terminé quand :** le SHA repris et la liste des différences à intégrer sont consignés, sans travail local perdu. Après toute intégration applicative, relancer les tests : les résultats de `7fba090` ne couvrent pas automatiquement une nouvelle fusion.

## Étape 2 — sécuriser les bons accès et l’environnement de test

1. Identifier explicitement le projet Supabase client et le projet Vercel ci-dessus. Vérifier les variables de la Preview, son URL de base, ses domaines de retour Auth et ses fournisseurs d’email. Ne pas copier les secrets dans Git, les rapports ou le chat.
2. Vérifier si la Preview pointe vers une base de test ou la production **avant de créer, modifier ou supprimer des données**. Utiliser une base isolée pour les essais destructifs et les données fictives. Toute ressource payante supplémentaire requiert un accord séparé.
3. Traiter le point de sécurité historique signalé dans [AUDIT-2026-09-07.md](AUDIT-2026-09-07.md), section « Secret historique » : le propriétaire doit confirmer la révocation/remplacement du jeton autrefois versionné dans `api_token.txt`. Son retrait du fichier courant ne suffit pas ; sa valeur ne doit jamais être recopiée.
4. Vérifier une sauvegarde restaurable avant la migration des données réelles. Prévoir le retour arrière pour le couple code/base, pas uniquement le code.

**Terminé quand :** projet, environnement, base cible, accès, état du secret historique et procédure de sauvegarde/restauration sont documentés sans secrets. Si un accès manque, préciser lequel ; conserver la protection Vercel.

## Étape 3 — vérifier puis appliquer les migrations manquantes

Comparer l’historique réellement appliqué avec `supabase/migrations/`. Les migrations d’audit suivantes sont dans la branche ; aucune application au Supabase client n’est attestée par Victor :

1. `20260907165243_audit_atomic_events.sql`
2. `20260907172118_audit_manual_credits.sql`
3. `20260907180725_audit_series_root_deletion.sql`
4. `20260907181033_audit_pack_accounting.sql`
5. `20260907181707_audit_admin_bootstrap.sql`
6. `20260907193051_audit_shared_limits.sql`
7. `20260907193754_audit_signup_profile.sql`
8. `20260908170656_client_external_event_link.sql`

Vérifier aussi leurs migrations antérieures. Appliquer uniquement ce qui manque, dans l’ordre, d’abord sur une copie/base de test appropriée. La dernière migration ajoute `events.external_url` et adapte la transaction de sauvegarde ; ne pas se contenter d’ajouter la colonne manuellement.

**Compatibilité importante :** les anciens formulaires débitant puis insérant séparément ne sont pas compatibles avec les nouveaux garde-fous. Pour la production, coordonner code, migrations et suspension des anciens chemins d’écriture. Les anciens déploiements/onglets sont concernés. Un retour à l’ancien code seul peut être incorrect avec le nouveau schéma.

Les fichiers `supabase/config.toml`, les données de seed QA et les lanceurs `scripts/qa.mjs` concernent le laboratoire local : ne pas les appliquer comme configuration ou données client.

**Terminé quand :** migrations appliquées et vérifiées sur la cible de test, sauvegarde d’une expérience opérationnelle, crédits et séries conservés, droits vérifiés. Un build Vercel vert n’est pas ce contrôle.

## Étape 4 — recette dans le navigateur de Rodrigue

Lire le [rapport du lot Didier](recette/2026-09-08-demandes-client/RAPPORT.md), puis reprendre les lignes de [COUVERTURE.csv](recette/2026-09-08-demandes-client/COUVERTURE.csv). Pour chaque page modifiée, inventorier chaque bouton, lien, champ et action conditionnelle ; donner à chacun un résultat et une preuve. Une lecture du code ou un test unitaire ne compte pas comme clic navigateur.

Parcours prioritaires sur données fictives isolées :

- Praticien : 11:11, 1,5 h, dates du 9 et 30 octobre ; erreur de validation, photo refusée puis acceptée, changement de langue, nouveau lieu, rechargement et nouvelle tentative. Vérifier la conservation des champs et un seul débit.
- Récurrences : hebdomadaire, toutes les deux semaines, mensuelle en fin de mois, dates libres ; modifier après publication ; retirer deux dates successivement puis la première ; vérifier les autres dates et le solde.
- Séjour 17 octobre 10 h → 18 octobre 16 h : durée horaire cachée ; retour journée sans perte ; deux dates/heures sur liste, carte, popup, fiche et agenda ; deux jours calendaires FR/DE/EN.
- Éditeur : chaque commande, combinaison des styles, les huit emojis, ouvrir/annuler/insérer un lien, URL invalide, aperçu, sauvegarde et rendu public. Vérifier le lien dédié distinct de Réserver, sa suppression et sa propagation dans la série.
- Mobile : titre très long, dates libres, menus et cartes ; aucune largeur débordante. Choisir rapidement plusieurs filtres puis Liste/Carte et une période ; vérifier que tous les choix restent actifs.
- Compléter les limites locales : Safari/iPhone et Android physiques, vraie ouverture du lien externe, import agenda, permission de géolocalisation accordée/refusée et accessibilité clavier/lecteur d’écran.
- Services : confirmation/récupération Auth sur les bons domaines, stockage, emails vers des boîtes de test, Stripe en mode test et webhook rejoué, désinscription/newsletter et quotas du fournisseur effectivement retenu. Aucun paiement ni campagne client réelle pendant cette recette.

À chaque défaut : reproduire, consigner, corriger, ajouter le test de régression adapté et **rejouer le même parcours réel après déploiement du correctif**. Rejouer aussi les parcours voisins touchés.

**Terminé quand :** les commandes des pages concernées ont un statut explicite (réussi, échec, bloqué, non applicable), tous les échecs bloquants sont corrigés/retestés et les limites restantes sont annoncées. Garder URL, SHA, rôle, données fictives et preuves avec le rapport. Ne pas conclure « tout fonctionne » sur la seule compilation.

## Étape 5 — production et compte rendu

Suivre la procédure de bascule de [l’audit initial](AUDIT-2026-09-07.md), section « Bascule client — ne pas appliquer les migrations seules ». Vérifier les autorisations de déploiement en cours avec Rodrigue avant de modifier la production ; ce document de reprise n’accorde pas à lui seul de nouveaux droits sur des comptes ou données.

**Terminé quand :** le SHA validé est déployé avec la bonne base, les parcours critiques sont rejoués en production de manière non destructive, les erreurs serveur sont contrôlées et un compte rendu distingue version livrée, tests réussis et réserves. Si la bascule échoue, conserver les écritures protégées et exécuter le retour testé ou corriger en avant.

## Comptes de test et documents à consulter au bon moment

- Pour recréer le laboratoire sur le Mac de Rodrigue : [QA-LOCAL.md](QA-LOCAL.md), avec comptes admin/praticien/autre praticien/en attente/visiteur et mot de passe fictif. **Ces comptes sont locaux : ils n’ont pas été créés sur la Preview ou chez le client.** `localhost:3100` désigne le Mac où le laboratoire tourne, pas celui de Victor à distance. Pour une préproduction distante, créer des comptes de recette séparés, avec mots de passe uniques transmis de façon privée.
- Pour comprendre chaque demande et l’arbitrage titre simple : [analyse D01–D13](ANALYSE-DEMANDES-CLIENT-2026-09-08.md).
- Pour les reproductions et les limites exactes : [preuves](recette/2026-09-08-demandes-client/PREUVES.md) et [anomalies](recette/2026-09-08-demandes-client/ANOMALIES.md).
- Pour les brouillons et la prise en compte des patches : [rapport brouillons](recette/2026-09-08-brouillons/RAPPORT.md).

**Lecture des anciens rapports :** les mentions « patches non reçus », « champ externe non livré » et « pas de déploiement Vercel » décrivent des états antérieurs. Les patches ont été reçus, le lien externe est livré et la Preview de `7fba090` a été déployée. En revanche, « pas de validation sur la base client » et les autres réserves non levées restent vrais.
