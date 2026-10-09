# Incident de réinitialisation du mot de passe — 9 octobre 2026

## Statut

**Corrigé et vérifié en production.**

Un vrai parcours de réinitialisation a été effectué d’un navigateur à un autre : demande du lien, réception de l’e-mail, ouverture dans un second navigateur, puis arrivée sur la page permettant de saisir deux fois le nouveau mot de passe.

## Symptôme observé

Après avoir cliqué sur « Reset my password », Didier arrivait sur la page d’accueil ou sur la connexion au lieu d’obtenir le formulaire de nouveau mot de passe. Son ancien mot de passe continuait à fonctionner dans un autre profil Chrome.

## Causes identifiées

Deux causes se cumulaient :

1. Le mécanisme PKCE initial dépendait du navigateur/profil ayant demandé le lien. L’ouverture du courriel dans un autre profil Chrome ne retrouvait pas le vérificateur local.
2. La liste des redirections autorisées dans Supabase contenait `https://forthesoul.ch/**`, mais pas `https://www.forthesoul.ch/**`. Comme la plateforme utilise le domaine avec `www`, Supabase pouvait refuser la destination demandée et renvoyer vers l’accueil.

Le nettoyage du navigateur n’était donc pas, à lui seul, la cause racine.

## Corrections appliquées

- La demande de réinitialisation est générée depuis le navigateur avec le bon domaine public.
- Le callback accepte désormais la récupération par `token_hash`, ce qui permet d’ouvrir le lien depuis un autre navigateur ou profil.
- Le modèle d’e-mail Supabase transmet le `token_hash` de récupération vers la bonne page.
- Les deux variantes de domaine sont autorisées dans Supabase :
  - `https://forthesoul.ch/**`
  - `https://www.forthesoul.ch/**`

## Preuve de fonctionnement

Test réel effectué sur la production :

1. création d’un compte de test temporaire ;
2. demande de réinitialisation depuis le navigateur intégré ;
3. réception du véritable e-mail de récupération ;
4. ouverture du lien dans Chrome, donc dans un autre navigateur ;
5. arrivée confirmée sur `https://www.forthesoul.ch/reinitialiser-mot-de-passe` ;
6. affichage confirmé des deux champs de nouveau mot de passe ;
7. suppression du compte de test temporaire.

Aucun mot de passe utilisateur réel n’a été consulté ou modifié pendant cette vérification.

## Consigne pour Didier

Il doit demander **un nouveau lien** depuis « Mot de passe oublié », puis utiliser uniquement le dernier e-mail reçu. Les anciens liens peuvent être expirés ou correspondre à la configuration antérieure.

## Test de non-régression

Le callback de récupération est couvert par `tests/auth-callback.test.ts`. La suite complète passe : **294 tests sur 294**.
