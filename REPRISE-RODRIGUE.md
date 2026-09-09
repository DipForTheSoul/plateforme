# ForTheSoul — reprise et tests manuels par Rodrigue

État transmis le 9 septembre 2026. Commencer ici avant les anciens rapports.

## Consigne de Victor — qui fait les tests ?

**Rodrigue effectue lui-même les tests manuels et les valide personnellement. La recette n’est pas à déléguer à son IA.** Il se connecte avec chaque rôle, saisit les données, clique sur les boutons, observe le résultat et rejoue les essais après correction.

L’IA peut aider à préparer l’environnement, expliquer le code, diagnostiquer et corriger les défauts signalés par Rodrigue. Elle ne pilote pas le navigateur à sa place pour cette recette et ne coche pas les essais comme réussis sans résultat confirmé par lui. Les tests automatisés restent une preuve technique complémentaire, pas une validation manuelle.

Cette consigne remplace toute formulation antérieure suggérant de confier la recette à l’IA. Les tests déjà réalisés sur le Mac de Victor restent des preuves historiques ; **la nouvelle passe manuelle appartient à Rodrigue**.

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

## Identifiants pour les tests manuels

### Laboratoire local uniquement

Après avoir recréé le laboratoire sur son Mac avec [QA-LOCAL.md](QA-LOCAL.md), Rodrigue ouvre **http://localhost:3100/connexion**.

| Rôle à tester | Adresse de connexion |
| --- | --- |
| Administrateur | `admin@forthesoul.test` |
| Praticien approuvé | `praticien@forthesoul.test` |
| Autre praticien — contrôle de séparation des comptes | `autre@forthesoul.test` |
| Praticien en attente de validation | `nouveau@forthesoul.test` |
| Visiteur / participant | `visiteur@forthesoul.test` |

**Mot de passe commun, fictif et exclusivement local : `Fts-QA-Local-2026!`**. Les adresses et ce mot de passe sont ceux des comptes créés par le seed de recette ; si un mot de passe a ensuite été changé localement, utiliser sa nouvelle valeur. Pour le parcours public anonyme, se déconnecter ou ouvrir une fenêtre privée. Les favoris publics ne nécessitent pas de compte.

Le serveur de Victor n’est pas accessible depuis le Mac de Rodrigue : `localhost` désigne l’ordinateur utilisé. Ces identifiants ne sont **pas** des accès à la Preview Vercel ou à la production. Ce mot de passe est publié dans le dépôt : ne jamais le réutiliser en ligne.

### Tests sur la version en ligne

Deux accès distincts sont nécessaires : le compte Vercel client ouvre la Preview protégée ; les comptes de l’application donnent ensuite les rôles administrateur/praticien/visiteur. **Les comptes applicatifs distants de recette n’ont pas été créés par Victor ; aucun mot de passe distant n’est fourni dans ce document.**

Avant ses essais en ligne, Rodrigue doit :

1. Vérifier que la Preview utilise une base de test isolée, avec les migrations requises, conformément aux étapes 2 et 3 ci-dessous.
2. Créer ou identifier les comptes de recette correspondant aux rôles du tableau, avec des adresses de test qu’il contrôle et des mots de passe uniques. Prévoir un solde fictif pour les essais de publication et vérifier les états approuvé/en attente.
3. Conserver ces accès dans un gestionnaire de mots de passe ou un canal privé, **pas dans ce dépôt public**.
4. Se connecter lui-même avec chaque compte et vérifier le rôle affiché avant de commencer les parcours.

Si ces accès ne sont pas prêts, les tests en ligne sont marqués « bloqués — comptes/environnement à préparer », pas « réussis ». Il peut effectuer la passe locale avec les identifiants ci-dessus en attendant ; elle ne remplace pas la validation de l’environnement distant.

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

## Étape 4 — Rodrigue teste personnellement dans son navigateur

Rodrigue lit le [rapport du lot Didier](recette/2026-09-08-demandes-client/RAPPORT.md), puis reprend les lignes de [COUVERTURE.csv](recette/2026-09-08-demandes-client/COUVERTURE.csv) dans une nouvelle grille pour sa propre passe, sans écraser les preuves historiques. Pour chaque page modifiée, il inventorie chaque bouton, lien, champ et action conditionnelle, puis les manipule lui-même. Une lecture du code, un test unitaire ou un parcours piloté par l’IA ne compte pas comme sa validation manuelle.

Pour chaque essai, il renseigne : date, URL et version testées, compte/rôle, action effectuée, résultat attendu, résultat réellement observé, statut, preuve et nom du testeur **Rodrigue**. La grille est complétée au fil des manipulations, pas à partir des conclusions de l’IA.

Parcours prioritaires sur données fictives isolées :

- Praticien : 11:11, 1,5 h, dates du 9 et 30 octobre ; erreur de validation, photo refusée puis acceptée, changement de langue, nouveau lieu, rechargement et nouvelle tentative. Vérifier la conservation des champs et un seul débit.
- Récurrences : hebdomadaire, toutes les deux semaines, mensuelle en fin de mois, dates libres ; modifier après publication ; retirer deux dates successivement puis la première ; vérifier les autres dates et le solde.
- Séjour 17 octobre 10 h → 18 octobre 16 h : durée horaire cachée ; retour journée sans perte ; deux dates/heures sur liste, carte, popup, fiche et agenda ; deux jours calendaires FR/DE/EN.
- Éditeur : chaque commande, combinaison des styles, les huit emojis, ouvrir/annuler/insérer un lien, URL invalide, aperçu, sauvegarde et rendu public. Vérifier le lien dédié distinct de Réserver, sa suppression et sa propagation dans la série.
- Mobile : titre très long, dates libres, menus et cartes ; aucune largeur débordante. Choisir rapidement plusieurs filtres puis Liste/Carte et une période ; vérifier que tous les choix restent actifs.
- Compléter les limites locales : Safari/iPhone et Android physiques, vraie ouverture du lien externe, import agenda, permission de géolocalisation accordée/refusée et accessibilité clavier/lecteur d’écran.
- Services : confirmation/récupération Auth sur les bons domaines, stockage, emails vers des boîtes de test, Stripe en mode test et webhook rejoué, désinscription/newsletter et quotas du fournisseur effectivement retenu. Aucun paiement ni campagne client réelle pendant cette recette.

À chaque défaut, Rodrigue le reproduit et consigne les étapes avec une capture ou le message exact. Son IA peut diagnostiquer, corriger le code et ajouter le test de régression adapté. **Après déploiement du correctif, Rodrigue rejoue lui-même le même parcours et les parcours voisins touchés**, puis confirme ou refuse la correction.

**Terminé quand :** Rodrigue a personnellement testé les commandes des pages concernées, attribué un statut explicite (réussi, échec, bloqué, non applicable), rejoué les corrections et confirmé le compte rendu. Les limites restantes sont annoncées. Un essai non effectué par lui reste « non testé manuellement », même si les tests automatisés ou ceux de Victor sont verts.

## Étape 5 — production et compte rendu

Suivre la procédure de bascule de [l’audit initial](AUDIT-2026-09-07.md), section « Bascule client — ne pas appliquer les migrations seules ». Vérifier les autorisations de déploiement en cours avec Rodrigue avant de modifier la production ; ce document de reprise n’accorde pas à lui seul de nouveaux droits sur des comptes ou données.

**Terminé quand :** le SHA validé est déployé avec la bonne base, Rodrigue rejoue personnellement les parcours critiques en production de manière non destructive, les erreurs serveur sont contrôlées et il confirme un compte rendu distinguant version livrée, tests réussis et réserves. Si la bascule échoue, conserver les écritures protégées et exécuter le retour testé ou corriger en avant.

## Comptes de test et documents à consulter au bon moment

- Pour recréer le laboratoire sur le Mac de Rodrigue : [QA-LOCAL.md](QA-LOCAL.md). Les identifiants sont repris dans la section « Identifiants pour les tests manuels » ci-dessus ; les commandes de préparation restent dans ce guide.
- Pour comprendre chaque demande et l’arbitrage titre simple : [analyse D01–D13](ANALYSE-DEMANDES-CLIENT-2026-09-08.md).
- Pour les reproductions et les limites exactes : [preuves](recette/2026-09-08-demandes-client/PREUVES.md) et [anomalies](recette/2026-09-08-demandes-client/ANOMALIES.md).
- Pour les brouillons et la prise en compte des patches : [rapport brouillons](recette/2026-09-08-brouillons/RAPPORT.md).

**Lecture des anciens rapports :** les mentions « patches non reçus », « champ externe non livré » et « pas de déploiement Vercel » décrivent des états antérieurs. Les patches ont été reçus, le lien externe est livré et la Preview de `7fba090` a été déployée. En revanche, « pas de validation sur la base client » et les autres réserves non levées restent vrais.
