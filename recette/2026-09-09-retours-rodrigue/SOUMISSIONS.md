# Retours admin — 9 septembre 2026

> Historique des étapes intermédiaires. Le périmètre et les preuves finales sont dans `REPRISE-VICTOR-2026-09-09.md` à la racine. Le catalogue est désormais regroupé lui aussi, et les mises en avant sont dédupliquées par série ; les nombres de tests ci-dessous sont historiques.

## Livré uniquement en local

- Les cartes des soumissions et de leur historique affichent les deux dates et heures suisses lorsqu'une date de fin existe, avec le nombre de jours calendaires inclusifs.
- Cas de recette : vendredi 11.09.2026 à 11:00 → dimanche 13.09.2026 à 16:00 — 3 jours.
- Deux liens « Retour aux soumissions », avant et après le formulaire de modification admin. Navigation sans enregistrement ni publication ; fonctionnement du brouillon existant conservé.
- FR, DE et EN ; pas de modification de données, de migration ou de push pour ce lot.

## Preuves techniques

- `npm run check` : lint, typage et 229 tests (40 fichiers) réussis, dont 6 nouveaux tests des pages admin.
- `node scripts/qa.mjs build` réussi ; serveur local compilé relancé sur localhost:3100.
- Navigateur de contrôle séparé, compte admin QA : liste connectée affiche les dates 11–13 septembre et « 3 jours » ; liens de retour présents sur la page de modification.
- `git diff --check` réussi. Validation visuelle manuelle par Rodrigue encore à faire sur cette version.

## Regroupement des prochaines expériences à l'accueil — validé par Rodrigue et livré localement

Mail Didier du 6 septembre 2026 à 21:38, fil « ForTheSoul / Suivi modifs » relu : il demande de voir les dates d'une série en modification et de pouvoir supprimer une occurrence. Ce message ne demande pas le regroupement des cartes de l'accueil.
Rodrigue a ensuite accepté une carte par série avec sa prochaine date. La section « Prochaines expériences » regroupe maintenant par identifiant de série (pas par titre), prend la première occurrence future approuvée, trie chronologiquement et applique la limite de huit après regroupement. Une racine passée ou absente ne masque pas ses futures occurrences. Les mises en avant conservent leur traitement existant ; le catalogue complet n'est pas regroupé.

Preuves après ce complément : `npm run check` réussi (234 tests, 41 fichiers), compilation locale réussie puis serveur relancé. Navigateur connecté : l'accueil affiche une carte « Test » pour la série, puis « Méditation guidée. », au lieu des quatre cartes de la même série. Cinq tests couvrent regroupement, prochaine date, racine absente/refusée, titres identiques, limite après regroupement et exclusion des dates passées/non approuvées.

## Retouches précédemment relevées restant à traiter

- Marqueurs de mise en forme visibles dans l'extrait de description des soumissions admin.
- Filtre de prix libellé CHF alors que les cartes peuvent afficher EUR.
- Solde de crédits à rendre visible dans la page de modification praticien.
