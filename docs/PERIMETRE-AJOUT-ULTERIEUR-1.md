# Périmètre — ajout ultérieur n°1

État : développé et vérifié en local le 28 septembre 2026, non publié.

## Livré dans ce lot

1. Contact direct d’un praticien depuis sa fiche, sans exposer son adresse.
2. Conservation sécurisée des demandes et suivi administrateur avec export CSV.
3. Parcours public trilingue de recrutement des praticien·nes et ses points d’entrée.
4. Finitions incluses : lieux, filtres prix, textes légaux fixes, retrait du compte test des listes publiques, libellé Favoris, portraits mobiles et erreurs multilingues.

## Décisions de protection des données

- Le consentement contact est obligatoire ; le consentement newsletter est indépendant, facultatif et décoché.
- Aucun abonnement MailerLite n’est déclenché par ce formulaire.
- L’adresse IP brute n’est pas stockée : seule une empreinte HMAC est conservée.
- Les visiteurs et praticien·nes ne peuvent pas lire la table. Seul l’administrateur authentifié dispose d’une politique de lecture.
- Les secrets et l’adresse de réception de secours restent exclusivement côté serveur.

## Contenus à valider par le client

- Formulations commerciales et bénéfices de la page « Devenir praticien·ne ».
- Conditions générales de vente et mentions légales (versions FR/DE/EN provisoires).
- Prix affichés : ils proviennent des paramètres existants et ne sont pas codés en dur dans la nouvelle page.

## Contrôles avant déploiement

1. Relire et appliquer la migration sur la bonne base sans réinitialisation ni suppression de données.
2. Vérifier la configuration transactionnelle e-mail sur l’environnement de recette.
3. Envoyer une demande vers une boîte contrôlée, répondre via `reply-to`, puis contrôler la ligne admin et l’export CSV.
4. Vérifier qu’un compte non-admin reçoit bien un refus RLS à la lecture.
5. Vérifier la géolocalisation sur HTTPS et les rendus iPhone réels.

## Non développé

- Descriptions d’expérience DE/EN séparées dans l’admin : le modèle actuel ne les stocke pas. Le point est documenté, sans extension du périmètre.
- Tous les éléments explicitement hors périmètre dans la demande source.
