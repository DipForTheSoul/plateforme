# Rapport de recette — 14 septembre 2026

## Objet de cette livraison

Correction des derniers points actionnables du retour de Didier et création du
guide de prise en main administrateur.

## Modifications réalisées

1. L’import de contacts utilise le client serveur privilégié uniquement après
   vérification du rôle administrateur. Les droits directs d’insertion restent
   retirés aux rôles du navigateur.
2. Un fichier CSV exporté depuis Wix peut être sélectionné directement dans
   l’administration.
3. Les colonnes Wix adresse e-mail, prénom, nom et étiquettes sont reconnues
   même si leur ordre change.
4. Le format manuel historique reste accepté.
5. Les doublons restent ignorés et l’import ne supprime aucun contact existant.
6. Les erreurs et confirmations de l’import sont disponibles en français,
   anglais et allemand, sans exposer les erreurs techniques de la base.
7. Le guide de prise en main explique l’administration, les séries récurrentes,
   les prix, les lieux, les crédits, les contacts Wix, MailerLite et les
   statistiques.
8. Le guide rappelle la décision existante : la mise en avant est actuellement
   gérée par l’administration. Une mise en avant payante côté praticien est le
   prochain développement à cadrer.

## Vérifications automatiques

- `npm run lint` : réussi ;
- `npm run typecheck` : réussi ;
- `npm test` : 47 fichiers, 270 tests réussis ;
- `npm run build` : build Next.js de production réussi ;
- nouveaux tests : lecture CSV Wix, ordre des colonnes, format sans en-tête,
  lignes invalides, contrôle du client serveur après autorisation admin.

## Vérifications du document

- PDF A4 de quatre pages généré ;
- les quatre pages ont été rendues en images et contrôlées visuellement ;
- aucune coupure ou superposition restante ;
- aucun mot de passe, jeton ou clé API n’est inclus.

## Données et déploiement

- aucune migration SQL dans cette livraison ;
- aucun seed, reset ou script destructif ;
- aucun contact, praticien, événement, lieu ou historique n’est supprimé ;
- le déploiement applicatif peut être réalisé sans modification de la structure
  ni du contenu de la base de production.
