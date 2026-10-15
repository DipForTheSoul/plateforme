# Carte et filtres — correction locale du 15 octobre 2026

Les trois défauts ont été reproduits en local lorsque JavaScript est absent. Le correctif rend la carte initiale, les filtres et la réinitialisation utilisables avant hydratation ; il conserve ensuite les interactions enrichies. Rien n'a été publié, poussé ou envoyé.

## Environnement et périmètre

- Worktree : `/Users/rodrigue/.codex/worktrees/supabase-cache-didier-fixes/plateforme` ; base HEAD `d53cfd1`, non commitée après correction. Selon vérification de l'agent principal, contenu initial identique à `fe29b7ba91bdadb0a69bb994f1e1a20446378836` en production. Ce rapport ne certifie pas le domaine public.
- URL testée : `http://localhost:3102/experiences`. Build optimisé Next.js 16.4.0, React 19.2.4, Leaflet 1.9.4, Playwright 1.64.0, Node 22.23.2.
- API synthétique GET uniquement sur `http://127.0.0.1:54321`, deux expériences inventées FR/DE de 2030. Aucune connexion Supabase distante, aucune donnée personnelle, aucun paiement/e-mail, aucune suppression.
- Les tests interceptent toutes les tuiles OSM avec une image synthétique explicitement marquée QA et bloquent les autres domaines. Ils prouvent le rendu, la géométrie et l'interaction du composant, pas la disponibilité actuelle du fournisseur OSM. Aucun test de charge n'a été effectué sur un tiers.

## Reproduction, cause et correction séparées

| Défaut | Reproduction avant correction | Cause démontrée | Correction et preuve |
|---|---|---|---|
| Carte invisible | WebKit 768×1024, JavaScript désactivé, `?vue=carte&langue=fr` : 0 tuile, liste FR seule, conteneur vide. Capture `output/tablet-before-20261015.png`. | Le rendu serveur ne fournissait qu'un div ; toute la carte dépendait de l'import Leaflet et d'un effet React. | Carte SSR en tuiles OSM bornées (au plus 9) avec les mêmes coordonnées et liens des événements. Leaflet prend le relais après une tuile chargée ; import rejeté intercepté ; erreur fournisseur explicitée. Tests vérifient vrais pixels/images chargées, marqueurs, popup, taille, rotation et secours. |
| Réinitialisation inopérante | Même contexte : bouton présent, toucher sans effet, URL `?vue=carte&langue=fr` inchangée. | Reset uniquement `onClick`, aucun lien HTML. Recherche différée pouvait également garder un brouillon périmé. | Vrai lien vers le catalogue sans paramètres ; navigation client après hydratation ; timer annulé au reset ; brouillon suit l'historique. Tests vérifient URL, recherche vide et 2 résultats, y compris pendant navigation lente. |
| Sélection des filtres inopérante | Même contexte : 0 select nommé ; sélection DE conserve URL `langue=fr` et résultat FR. | Selects sans `name`/formulaire, changement uniquement JS ; ouverture mobile désactivée tant que React non hydraté. | Formulaire GET commun nommé, bouton Filtrer et `<details>` natif ; sélection instantanée optimiste après hydratation. Canton conditionnel CH et normalisation serveur d'un ancien canton après changement de pays. Tests vérifient le résultat DE, pas seulement l'URL. |

Les puces ont également de vrais liens. Les filtres sont désormais repliables nativement sur tous les écrans (fermés au départ), ce qui réduit la hauteur avant la carte. La liste reste sous la carte jusqu'au breakpoint XL. Les popups sont limitées à la largeur utile et recalculées à la rotation.

### Pourquoi la correction précédente était insuffisante

Le GET natif concernait seulement les dates. Les anciens tests sans JS s'arrêtaient au changement d'URL `vue=carte` ; les tests hydratés comptaient des balises de tuiles sans contrôler le chargement réel. Le verrou d'hydratation du bouton Filtres empêchait tout accès si le JavaScript échouait. Les 5 anciens tests unitaires de contrôles, verts avant correction, utilisaient un routeur simulé et ne pouvaient démontrer le fonctionnement avant hydratation ni sur réseau réel.

La concordance avec les symptômes ne prouve pas que le navigateur de Didier bloque précisément JavaScript. Son modèle de tablette, OS, versions Chrome/Safari/DuckDuckGo et bloqueurs ne sont pas connus ; cette cause côté appareil reste non vérifiée.

## Vérifications

`npm run check` : lint et typage réussis ; **329 tests réussis dans 67 fichiers**, aucun échec. `npm run build` avec uniquement les variables synthétiques ci-dessous : réussi, 125 pages générées. Les fichiers de tests existants concernés ont été adaptés au formulaire commun et au `<details>`.

Matrice Playwright : **88/88 réussis, aucun échec, 47,5 s**, voir `output/catalogue-20261015/report/index.html`. Huit scénarios par projet : tactile à froid + rotation, préhydratation retardée, réseau lent + reset/historique, sans JS, scripts bloqués, tuiles bloquées, module Leaflet bloqué, recherche différée avec réponse rapide. Une dernière revue visuelle a déplacé le contrôle zoom en bas à gauche pour éviter qu'il recouvre le titre du popup ; après rebuild et lint ciblé réussis, **11/11 vérifications tactiles finales réussissent en 13,1 s**, avec assertion de non-recouvrement et rotation aller-retour. Captures finales dans `output/catalogue-20261015-zoom-final` ; commande `npx playwright test --config playwright.catalogue.config.ts --grep 'tactile à froid' --output output/catalogue-20261015-zoom-final --reporter list`.

La suite historique `tests/e2e/mobile-tablet-interactions.spec.ts` a été adaptée aux nouveaux éléments natifs mais n'a pas été rejouée intégralement : elle inclut des parcours hors de ces trois corrections. Sa couverture catalogue ciblée est remplacée ici par les scénarios isolés ci-dessus. Ne pas confondre les 329 tests Vitest (qui excluent les dossiers E2E) avec cette suite navigateur historique.

| Surfaces émulées | Moteur réellement lancé |
|---|---|
| iPhone SE 320×568 ; iPhone 13 390×664 | WebKit 27.2 |
| iPad Mini 768×1024 et 1024×768 | WebKit 27.2 |
| iPad Pro 11 834×1194 et 1194×834 | WebKit 27.2 |
| Pixel 7 412×839 | Chromium 156.0.8078.4 |
| Tablette Android 800×1280 et 1280×800 | Chromium 156.0.8078.4 |
| Tablette 820×1180 tactile | Firefox 157.0 |
| Bureau 1280×720 | Chromium 156.0.8078.4 |

Les tests tactiles emploient `tap` lorsque la surface le supporte ; la sélection des menus natifs utilise l'API navigateur `selectOption`. Il ne s'agit pas de vrais appareils Safari, Chrome iOS ou DuckDuckGo. Minimum documenté dans Next installé : Safari 16.4, Chrome/Firefox 111 ; versions antérieures non certifiées.

### Investigations intermédiaires conservées

- `output/catalogue-20261015-dev-first` : 53/55 verts ; capture Firefox détachée et reset bureau rouge pendant une exécution où les sources ont changé (HMR). La contribution exacte du HMR n'est pas prouvée. Les mêmes scénarios passent ensuite sur build local figé.
- `output/catalogue-20261015-first-build` : 55/66 verts ; les 11 échecs du nouveau scénario retardé provenaient du test cherchant un select dans le panneau replié après navigation GET. Le résultat DE était déjà correct dans les traces. Le scénario a été corrigé pour ouvrir le panneau, sans modification applicative destinée à masquer cet échec.
- Revue des captures : popup trop large sur iPhone SE identifiée puis corrigée ; assertion des limites du popup ajoutée, y compris rotation aller-retour. Aucune interaction forcée ni test ignoré pour obtenir le vert.

## Relancer localement

Depuis le worktree, dans un premier terminal :

```sh
node tests/browser/catalogue-server.mjs
```

Dans un second terminal (valeurs fictives, non secrètes) :

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-local-anon NEXT_PUBLIC_SITE_URL=http://localhost:3102 npm run build
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-local-anon NEXT_PUBLIC_SITE_URL=http://localhost:3102 npm run start -- --port 3102 --hostname localhost
```

Puis `npx playwright test --config playwright.catalogue.config.ts`. Ne pas remplacer l'URL Supabase par une production. Le serveur refuse toute mutation. Le nom d'hôte `localhost` évite une boucle de réécriture next-intl observée avec le serveur lancé sur `127.0.0.1`.

## Limites, sécurité et prochaine porte

Aucune modification d'authentification, RLS, paiement, quota ou schéma. Les coordonnées déjà publiques restent les seules données cartographiques. Attribution OSM visible et URL canonique de tuiles conformément à https://operations.osmfoundation.org/policies/tiles/ ; pas de préchargement massif ni mise en cache hors politique.

Si un bloqueur refuse aussi les images OSM, aucun fond cartographique tiers ne peut être garanti ; la liste et les marqueurs SSR restent disponibles, et la version hydratée affiche un message. Une panne totale de JS ne permet pas de détecter dynamiquement une panne de tuiles. Pas d'audit global de sécurité, accessibilité ou performance revendiqué.

Rollback : aucun état distant modifié ; retirer uniquement les fichiers/hunks de cette correction pour retrouver la base. Préserver les modifications préexistantes, notamment `docs/RETOUR-DIDIER-2026-10-13.md` et les anciens `output/`. Prochaine porte : revue locale, puis autorisation de publication éventuelle et recette sur l'appareil exact de Didier. Aucune preuve de production corrigée à ce stade.
