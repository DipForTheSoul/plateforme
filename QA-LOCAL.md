# Recette locale connectée — ForTheSoul

Environnement fictif, séparé du Supabase client, sans Stripe, Resend ou MailerLite réels. Il fonctionne sans compte cloud ni abonnement. Il utilise les ressources du Mac (VM dédiée : 4 CPU, 6 Go RAM, disque de données extensible jusqu’à 20 Go ; téléchargements initiaux de plusieurs Go).

## Reprendre sur le Mac de Victor

Le dossier de travail est `/Users/victorltd/Desktop/Forthesoul-audit`. L’application est accessible sur **http://localhost:3100**, la boîte de réception fictive sur **http://127.0.0.1:54324**. Ces adresses ne sont pas accessibles depuis l’ordinateur de Rodrigue.

Les comptes ci-dessous ont tous le mot de passe de recette **`Fts-QA-Local-2026!`**. Ces identifiants ne doivent jamais être utilisés en production.

| Adresse | Usage |
| --- | --- |
| admin@forthesoul.test | Administration |
| praticien@forthesoul.test | Praticien approuvé |
| autre@forthesoul.test | Second praticien, contrôle des droits |
| nouveau@forthesoul.test | Praticien en attente |
| visiteur@forthesoul.test | Participant |

Les favoris visiteurs sont locaux au navigateur : aucun compte n’est nécessaire. La base contient uniquement des comptes, un lieu, des catégories et des expériences fictifs. Les contrôles automatisés créent puis suppriment leurs propres objets temporaires ; les comptes ci-dessus et les essais manuels restent disponibles.

## Démarrer / recréer sur un Mac

Prérequis : Node 22+, npm, Homebrew, Colima, Docker CLI, Supabase CLI. La recette a été exécutée avec Colima 0.10.3, Docker CLI 29.8.0 et Supabase CLI 2.90.0. Ne pas utiliser le profil Docker ou Supabase d’un autre projet.

```sh
brew install colima docker supabase/tap/supabase
npm ci
colima start forthesoul-qa --cpu 4 --memory 6 --disk 20 --mount none --port-forwarder none --activate=false --ssh-config=false
DOCKER_HOST="unix://${HOME}/.colima/forthesoul-qa/docker.sock" supabase start --exclude realtime,studio,edge-runtime,logflare,vector,supavisor
node scripts/qa-tunnel.mjs
node scripts/qa.mjs seed
node scripts/qa.mjs verify
node scripts/qa.mjs build
node scripts/qa.mjs start
```

Lancer depuis la racine du dépôt. Ne pas lancer `supabase db reset` sur une base contenant des essais à conserver. `seed` ajoute les comptes manquants sans effacer les modifications existantes. Pour développer, remplacer les deux dernières commandes par `node scripts/qa.mjs serve`.

Le tunnel est à lancer une seule fois par démarrage de VM : SSH peut rendre la main tout en conservant les redirections dans son processus maître. Une seconde ouverture du même port doit échouer ; ne pas la contourner. Les ports 54321, 54322 et 54324 doivent écouter uniquement sur **127.0.0.1**, jamais sur `*`. Le serveur Next est lié à `localhost`, pas à `0.0.0.0`.

Les scripts récupèrent les clés de la base locale en mémoire et les transmettent au processus Next. Ils n’écrivent pas de clés dans le dépôt. Ils forcent le profil Docker dédié et refusent une URL Supabase autre que `http://127.0.0.1:54321`. Ne pas lancer ces scripts en production, ni publier les comptes fictifs sur Internet. `supabase/config.toml` et `seed-qa.sql` sont pour la recette locale : ne pas pousser cette configuration Auth ou ces données vers le projet client.

## Contrôles et boucle de correction

```sh
npm run check
node scripts/qa.mjs verify
node scripts/qa.mjs build
npm audit --audit-level=high
git diff --check
```

Avec le serveur Next démarré dans un autre terminal :

```sh
node scripts/qa.mjs auth
node scripts/qa.mjs web
```

`auth` effectue huit contrôles réels de confirmation/récupération via Mailpit, Auth et la route Next PKCE, puis supprime son compte temporaire. `web` crée trois expériences temporaires simultanées, vérifie leurs liens, leur agenda et le suivi HTTP limité, puis nettoie ses objets. `verify` comporte 25 contrôles. La suite `npm run check` comporte désormais 180 tests, dont 29 SQL ; ce ne sont pas des parcours navigateur.

Sur une installation de recette déjà existante, appliquer les migrations manquantes avant de redémarrer le code. Les nouveaux formulaires publics utilisent des limites partagées en base et refusent l’envoi si cette migration manque. Les scripts ne l’appliquent pas automatiquement. Une installation neuve avec `supabase start` les rejoue à la création de sa base.

`verify` exerce réellement Auth, les politiques SQL, Storage, PostGIS et la concurrence. Il ne remplace pas la recette navigateur. Après une modification, arrêter Next avec Ctrl+C, reconstruire puis relancer pour tester le paquet réellement destiné à la production. Une page ouverte pendant l’arrêt peut nécessiter un rechargement.

Parcours recommandé : créer une expérience de 1,5 h à 11 h avec deux dates libres (9 et 30 octobre), provoquer une erreur de validation, changer de langue, ajouter une photo, envoyer ; vérifier un seul crédit débité ; approuver en admin ; supprimer la première date seulement ; ajouter une récurrence ; tester la fiche publique, les favoris et le calendrier à largeur mobile. Le rapport d’audit précise les autres scénarios et les limites.

Les notifications sont capturées dans Mailpit. Un redémarrage de la VM peut vider cette boîte ; elle ne sert pas d’archive. Les paiements ne fonctionneront pas ici : les clés Stripe sont volontairement vides. Pour une recette Stripe réelle, utiliser un environnement client de test et des clés de test hors Git.

### Complément brouillons du 8 septembre

Les formulaires authentifiés conservent désormais leur brouillon sur cet appareil entre sessions (restaurable sept jours après modification). Tester fermeture/nouvel onglet, erreur puis correction, changement de langue et de compte, deux onglets concurrents, abandon annulé puis confirmé. Revenir sur la fiche après sauvegarde pour vérifier les données serveur et l’absence de vieux brouillon. Contact reste limité à l’onglet. Ne pas utiliser ces brouillons locaux sur un profil navigateur public partagé ; ce n’est pas du stockage chiffré ni une synchronisation entre ordinateurs.

Résultats et limites : [recette ciblée](recette/2026-09-08-brouillons/RAPPORT.md).

## Arrêter sans perdre les données

Arrêter le serveur Next avec Ctrl+C, puis :

```sh
colima stop forthesoul-qa
```

Cela libère la RAM et ferme les tunnels, sans supprimer le disque de recette. Pour reprendre : redémarrer le même profil avec `--port-forwarder none --activate=false --ssh-config=false`, vérifier que Supabase est démarré, rouvrir le tunnel puis lancer Next. Ne pas supprimer le profil si les essais manuels doivent être conservés.

## Déploiement client

Consulter `AUDIT-2026-09-07.md`. Cette installation locale n’est pas une copie des données de production ni un déploiement Vercel. La bascule des migrations et du code doit être coordonnée ; les anciens formulaires ne sont pas compatibles avec la nouvelle publication transactionnelle.
