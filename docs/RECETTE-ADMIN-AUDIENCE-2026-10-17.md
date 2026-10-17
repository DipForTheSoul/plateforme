# Admin, audience et consommation — 17 octobre 2026

## Version et périmètre

Base production `542eb57d2c6ff382f947d2659c44d11086f0613a`, branche isolée `codex/admin-audience-20261017`. Aucun ancien répertoire sale repris. Autorisation : corriger, tester puis publier Admin et compteur, sans suppression de données. Aucun mail envoyé.

## Causes établies

- Admin : la version publiée télécharge les anciennes lignes `page_views` par pages de 500 avant d'afficher le tableau de bord. Au-delà de 40 000 lignes, cela entraîne plus de 80 lectures séquentielles. Le clic Administration a été reproduit sans navigation immédiatement visible ; les autres rubriques ne sont pas soumises à cette lecture.
- Compteur : les lignes historiques mélangent passages automatiques et visiteurs ; elles ne permettent pas de reconstruire des personnes uniques. Elles sont conservées, mais retirées du tableau de bord public aux administrateurs. Les compteurs bruts des offres ne sont plus présentés comme classement fiable.
- Supabase avant le 12 : graphique Usage, précédent cycle, tooltip du 10 octobre : PostgREST 5,696 Go (98,8 %), Storage 67,513 Mo ; 11 octobre : PostgREST 18,861 Go (99,9 %), Storage 23,855 Mo. Ce dépassement provenait principalement des réponses de l'API de données, pas des images.
- Logs du 11 octobre, 00:00–24:00 Europe/Zurich : 347 940 appels `/rest/v1/events`, 347 758 `/rest/v1/settings`, 173 718 `/rest/v1/categories`, 173 703 `/rest/v1/practitioners`, agent `node`. Parmi les appels events, 347 325 sont des lectures de catalogue, 149 des détails, 114 des mises en avant, 352 autres. Exemples observés : sélection des offres et relations, limite 500, bornes temporelles variant à la milliseconde. Le code avant `c448cba` exécutait ces lectures sans cache public partagé. `c448cba` du 12 octobre a ajouté ce cache.
- Attribution limitée : ces traces Supabase identifient le serveur Node intermédiaire. Elles ne prouvent pas à elles seules quel visiteur, robot ou outil de test déclenchait les pages. Le pic des 16–17 octobre n'est pas la cause chronologique du dépassement déjà signalé le 12.

## Implémentation candidate

- Suppression des lectures exhaustives `page_views` du chargement Admin ; statistiques métier et audience rendues séparément avec Suspense et délais bornés.
- Fermeture du menu mobile après navigation, y compris lien vers la page courante.
- Nouvelle mesure indépendante : identifiant de navigateur aléatoire après accord, déduplication quotidienne en base et navigateurs distincts sur 30 jours. Exclusion des comptes connectés, previews et robots identifiés. Ce n'est pas une certification de visiteurs humains : UA falsifiables, appareils distincts et stockage effacé restent des limites explicites.
- Préférences cookies réouvrables dans le footer ; aucune mesure sans accord. Refus/acceptation côte à côte. Information de confidentialité adaptée au mécanisme réel.
- Migration uniquement additive : deux nouvelles tables protégées, une fonction réservée aux administrateurs ; aucune modification ni suppression des anciennes tables.

## Vérifications exécutées (candidate locale)

- `npm run check` : lint, types, 71 fichiers / 366 tests PASS.
- Build de production QA isolé : PASS, API locale uniquement, Stripe/MailerLite/Resend désactivés.
- PGlite : historique 40 027 lignes préservé, nouveaux compteurs à zéro indépendamment ; doublons ignorés ; navigateur dédupliqué sur plusieurs jours ; relevé de plus de 30 jours exclu ; anonyme et praticien refusés ; 100 000 relevés synthétiques agrégés en une ligne.
- Chrome réel, `localhost:3125`, fixtures uniquement : clic menu vers Administration en 454 ms ; 422 ms au petit format. Base locale contenant 40 250 anciennes lignes.
- Panne locale par verrou transactionnel temporaire sur la nouvelle table : message d'indisponibilité sans faux zéro ; cartes métier affichées et Newsletter accessible. Verrou relâché automatiquement, retour au compteur opérationnel.
- Menu fermé après clic, même sur URL courante. Formats CSS réellement observés : 312 px et 768 px (zoom navigateur existant), aucun débordement horizontal. Dimensions demandées au contrôleur différentes en raison du zoom ; ne pas les présenter comme appareils physiques.
- Visiteur fictif déconnecté : acceptation, rechargement, un seul navigateur / un relevé ; retrait puis navigation, toujours un seul relevé. Historique local inchangé : 40 250 lignes.
- Catalogue voisin : navigation, liste puis carte avec marqueur et contrôles de zoom affichés. Le reste de la recette précédente n'est pas réétiqueté comme rejoué ici.
- Preuves : `output/admin-audience-20261017/consent-mobile-312.png`, `admin-tablet-768.png`.

## Point Supabase PostGIS séparé

Lecture production confirmée : PostGIS 3.3.7 dans `public`, propriétaire `supabase_admin`, non relocalisable. Utilisateur SQL `postgres`, non membre de `supabase_admin`. 17 lieux ; aucune mutation réalisée.
Le déplacement non destructif requiert le propriétaire Supabase. La procédure alternative de réinstallation comporte des suppressions et n'est pas autorisée par la contrainte « aucune suppression ». Ne pas exécuter `DROP EXTENSION ... CASCADE`. Réponse au support à faire autoriser séparément. Source : https://supabase.com/docs/guides/database/extensions/postgis#troubleshooting

## État de livraison

NON PUBLIÉ à ce stade. Migration production non appliquée. Recette en ligne et identité du déploiement à compléter avant annonce client.
Pas de certification universelle, aucun iPad physique testé. Les navigateurs mesurés sont une estimation consentie, pas le nombre de toutes les personnes réelles.

## Retour arrière

Retour applicatif contrôlé vers `542eb57` si nécessaire ; laisser les nouvelles tables en place (compatibilité additive, aucune purge). Ne pas revenir à une ancienne branche contenant d'autres corrections. Conserver les règles anti-robots déjà actives.
