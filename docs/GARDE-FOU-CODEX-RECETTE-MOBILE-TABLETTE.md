# Garde-fou Codex — Recette mobile et tablette obligatoire

## Utilisation

Joindre ce fichier à une conversation Codex et demander : **« Applique ce garde-fou à mon projet avant toute livraison. »**

## Mission obligatoire

Avant d’affirmer qu’un site fonctionne sur mobile ou tablette, Codex doit installer ou réutiliser un véritable outil de test navigateur et exécuter les parcours critiques sur une matrice représentative. Une simple réduction de la fenêtre du navigateur ne constitue pas une preuve suffisante.

## Matrice minimale

Tester au minimum :

- petit iPhone en portrait avec WebKit/Safari ;
- iPhone récent en portrait avec WebKit/Safari ;
- iPad compact en portrait et paysage avec WebKit/Safari ;
- grand iPad en portrait et paysage avec WebKit/Safari ;
- mobile Android avec Chromium/Chrome ;
- tablette Android en portrait et paysage avec Chromium/Chrome ;
- tablette avec Firefox lorsque le projet la supporte.

Utiliser des surfaces tactiles, les bons user-agents et les dimensions réelles fournies par l’outil de test. Vérifier la version minimale de navigateur officiellement supportée par le framework du projet.

## Parcours à couvrir

Adapter les parcours au projet, mais contrôler systématiquement :

- ouverture, fermeture et navigation du menu ;
- tous les boutons, listes, modales et éléments tactiles importants ;
- changement de langue, de devise ou de préférence s’ils existent ;
- formulaires, champs de date, filtres et validation ;
- bannière de consentement : accepter et refuser ;
- authentification, navigation connectée et déconnexion ;
- absence d’élément masqué, tronqué, superposé ou inaccessible ;
- absence de défilement horizontal involontaire ;
- rotation portrait/paysage ;
- absence d’erreur JavaScript non traitée pendant chaque parcours.

## Méthode

1. Reproduire le problème signalé avant de modifier le code.
2. Distinguer un défaut du site d’un défaut du scénario de test.
3. Corriger la cause minimale, sans masquer l’erreur avec des délais ou des clics forcés.
4. Ajouter un test de non-régression stable.
5. Relancer lint, typage, tests unitaires, tests d’intégration, tests multi-appareils et build de production.
6. Tester l’URL réellement destinée aux utilisateurs, pas seulement une page locale ou une prévisualisation différente.
7. Si le défaut ne se reproduit pas, relever l’appareil, l’OS, le navigateur, sa version, les bloqueurs de contenu et les conditions réseau du déclarant.

## Conditions de validation

Codex ne doit écrire « fonctionne partout » que si le périmètre exact est nommé. La formulation attendue est :

> Les parcours testés fonctionnent sur la matrice et les versions indiquées. Les appareils ou navigateurs hors support officiel ne sont pas certifiés.

La livraison est refusée si :

- un parcours critique échoue ;
- une erreur JavaScript apparaît ;
- un débordement ou une superposition bloque une action ;
- un test a été ignoré, forcé ou rendu artificiellement vert ;
- le build ou les contrôles statiques échouent ;
- aucune preuve reproductible n’est fournie.

## Preuves à remettre

Le compte rendu final doit contenir :

- URL et version/commit testés ;
- appareils, moteurs, dimensions et orientations ;
- liste des parcours exécutés ;
- commandes exactes ;
- nombre de tests réussis et échoués ;
- captures ou traces pour tout échec ;
- limites connues et risque résiduel ;
- emplacement des tests de non-régression ajoutés.
