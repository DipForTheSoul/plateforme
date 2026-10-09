# Garde-fou Codex — Réinitialisation du mot de passe de bout en bout

## Utilisation

Joindre ce fichier à une conversation Codex et demander : **« Applique ce garde-fou au parcours de mot de passe oublié de mon projet. »**

## Mission obligatoire

Codex ne doit jamais déclarer le parcours de réinitialisation fonctionnel après avoir uniquement vérifié le code, la génération d’une URL ou la page finale. Il doit vérifier le parcours complet avec un compte de test autorisé et un véritable e-mail de récupération.

## Parcours positif obligatoire

1. Créer ou utiliser un compte de test dédié, sans toucher à un compte utilisateur réel.
2. Demander la réinitialisation depuis la page publique et le domaine réellement utilisés en production.
3. Vérifier que l’interface donne une réponse neutre qui ne révèle pas l’existence d’un compte.
4. Recevoir le véritable e-mail de récupération.
5. Ouvrir le lien dans le même navigateur et confirmer l’arrivée sur la page de nouveau mot de passe.
6. Refaire le test en ouvrant le lien dans un autre navigateur ou profil lorsque ce comportement doit être supporté.
7. Saisir et confirmer un nouveau mot de passe conforme aux règles.
8. Vérifier la connexion avec le nouveau mot de passe.
9. Vérifier que l’ancien mot de passe est refusé.
10. Supprimer le compte de test ou restaurer proprement son état.

## Cas négatifs obligatoires

Vérifier et documenter :

- lien expiré ;
- lien déjà utilisé ;
- jeton absent, modifié ou invalide ;
- mots de passe différents ;
- mot de passe trop faible ;
- domaine ou redirection non autorisés ;
- ouverture dans un autre navigateur/profil ;
- demande répétée et utilisation exclusive du dernier lien si le fournisseur invalide les précédents ;
- absence de fuite de jeton dans les logs, analytics, messages d’erreur ou URLs conservées après validation.

## Configuration à auditer

- URL publique canonique, avec et sans `www` selon l’architecture ;
- liste exacte des URL de redirection autorisées chez le fournisseur d’authentification ;
- modèle d’e-mail et variables réellement transmises ;
- callback serveur et validation du type de jeton ;
- comportement PKCE, échange de code ou `token_hash` selon le fournisseur ;
- durée de vie, usage unique et révocation des liens ;
- cookies de session sécurisés et redirection finale sûre ;
- limitation de débit et protection contre l’énumération de comptes.

## Règles de sécurité

- Ne jamais demander, afficher, journaliser ou modifier le mot de passe réel d’un utilisateur.
- Ne jamais partager un lien de récupération actif dans un rapport ou une capture.
- Utiliser uniquement des comptes de test explicitement autorisés.
- Ne pas conclure que le nettoyage du navigateur est la cause sans preuve.
- Tester les deux variantes de domaine uniquement si elles sont réellement supportées ; sinon imposer une redirection canonique cohérente.

## Conditions de validation

Le parcours n’est validé que si un vrai e-mail mène au formulaire, que le mot de passe est effectivement changé et que la connexion est vérifiée. Une capture du formulaire seule ne suffit pas.

## Preuves à remettre

Le compte rendu final doit contenir :

- environnement, domaine et version/commit testés ;
- fournisseur d’authentification ;
- navigateurs/profils utilisés ;
- cas positifs et négatifs exécutés ;
- résultat de la connexion avec le nouveau mot de passe et du refus de l’ancien ;
- tests automatisés ajoutés ;
- configuration corrigée, sans secret ni jeton ;
- limites connues et risque résiduel.
