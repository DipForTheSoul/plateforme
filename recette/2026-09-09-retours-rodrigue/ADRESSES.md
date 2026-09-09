# Suggestions et saisie manuelle des lieux

Demande autorisée par Rodrigue le 9 septembre 2026 : suggestions d’adresses et saisie libre en repli. Pas de carte ni de point à placer. Didier vérifie l’adresse avec l’événement, sans deuxième validation.

## Comportement

- Nouveau lieu depuis le formulaire d’expérience : suggestions suisses après 4 caractères et 450 ms sans frappe. Sélection souris ou clavier ; remplissage adresse, ville, canton, pays et coordonnées.
- Saisie manuelle accessible en permanence ; pas de carte, pas de coordonnées obligatoires et pas d’appel de géocodage à l’enregistrement manuel.
- Les nouvelles adresses de praticiens sont privées (créateur et admin) jusqu’à l’approbation de l’événement. La même transaction SQL approuve le lieu. L’admin voit l’adresse et le lien de correction sur la soumission.
- Les lieux historiques restent approuvés. Aucun crédit supplémentaire n’est débité pour le lieu.
- Un lieu manuel sans coordonnées peut être publié après vérification ; il ne figure pas sur la carte ni dans une recherche par rayon avant géocodage. Les listes textuelles restent utilisables. L’admin peut corriger son adresse sans qu’une panne géographique bloque la sauvegarde.

## Fournisseur et limites

- geo.admin.ch / swisstopo SearchServer, répertoire officiel des adresses suisses ; pas de compte, pas de clé, pas de ressource payante créée.
- Références : https://docs.geo.admin.ch/access-data/search.html et https://www.geo.admin.ch/en/general-terms-of-use-fsdi . Gratuit dans les limites de fair use, sans garantie de disponibilité.
- Données transmises : fragment d’adresse et langue uniquement, via le serveur. Pas de nom du praticien, email, description d’événement ou jeton client. Notice et attribution visibles sous le champ.
- Route réservée aux praticiens/admins ; limites partagées 30 requêtes/minute/utilisateur et 100/minute/application ; timeout 5 s, aucune relance automatique, réponses no-store et aucun journal applicatif de recherche.
- Résultats limités à 5, schéma validé, labels rendus comme texte, coordonnées bornées. Requêtes obsolètes ignorées/annulées. Repli manuel en cas de panne, quota ou absence de résultat.
- Nominatim existant reste réservé au géocodage ponctuel, jamais à l’autocomplétion (interdite sur son instance publique).

## Livraison

- Migration requise : `20260909145000_venue_event_review.sql`. Application locale uniquement pour la recette ; aucune migration distante ou mise en production dans ce lot.
- Tests ajoutés : fournisseur, authentification/quota/panne, sélection clavier, invalidation des coordonnées, saisie manuelle hors ligne, enregistrement serveur et vraie transaction PostgreSQL avec RLS/validation du lieu.
- La validation manuelle de Rodrigue reste à effectuer. Les tests techniques ne la remplacent pas.

## Résultats techniques

- `npm run check` : lint et typage réussis, 223 tests / 39 fichiers réussis.
- `node scripts/qa.mjs build` : compilation réussie ; serveur local recompilé et redémarré sur 3100.
- Migration appliquée uniquement via `supabase migration up --local` dans l’instance QA isolée, sans reset ni effacement des essais de Rodrigue.
- Contrôle navigateur technique séparé : endpoint authentifié HTTP 200 avec les suggestions réelles « Rue Charles-GALLAND 2 1206 Genève » ; clic puis adresse/ville/GE/CH et coordonnées correctement remplis. Aucune carte rendue, aucun lieu ni événement créé par ce contrôle.
