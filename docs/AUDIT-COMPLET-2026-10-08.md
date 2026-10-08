# Audit complet avant nouvelle recette client — 8 octobre 2026

## Décision

La livraison reste bloquée tant que la branche de prévisualisation n'a pas été
redéployée et contrôlée. La production n'est pas modifiée par cet audit.

## Parcours et preuves

| Zone | Contrôle exécuté | Résultat |
| --- | --- | --- |
| Qualité statique | ESLint, TypeScript, diff Git | Réussi |
| Tests applicatifs | Vitest, composants, règles métier, API, SQL simulé | 296 tests réussis |
| Build | paquet Next.js de production, 123 pages | Réussi |
| Base isolée | RLS, rôles, crédits, concurrence, stockage, anti-spam, PostGIS | 25 contrôles réels réussis |
| Authentification | confirmation, connexion, récupération, remplacement du mot de passe | 8 contrôles réels réussis |
| Récupération navigateur | formulaire, e-mail Mailpit, lien Supabase PKCE, callback Next | arrivée confirmée sur « Nouveau mot de passe » |
| Web réel | rendu Next, navigation adjacente, agenda, suivi, anti-spam | 8 contrôles réels réussis |
| Public | 15 routes en français, allemand et anglais | 45 pages parcourues |
| Praticien | tableau de bord, expériences, dépôt, profil, crédits | 5 pages parcourues avec session réelle |
| Administration | tableau de bord et 9 rubriques | 10 pages parcourues avec session réelle |
| Dépendances de production | `npm audit --omit=dev --audit-level=high` | 0 vulnérabilité |

## Défauts corrigés pendant l'audit

1. La récupération du mot de passe était initiée côté serveur avec une origine
   fixe. Le vérificateur PKCE pouvait alors ne plus correspondre au domaine qui
   recevait le callback, lequel renvoyait silencieusement vers la connexion.
   L'envoi est désormais initié dans le navigateur sur l'origine réellement
   visitée, après validation et limite anti-abus côté serveur.
2. Le formulaire gère maintenant les pannes réseau et ne contourne pas la
   limite anti-abus lorsque celle-ci absorbe une demande.
3. La chaîne de dépendances de production `sharp` et `source-map-js` a été mise
   à jour ; l'audit de production est revenu à zéro vulnérabilité.
4. Vitest, les types Node et la configuration ESLint/Next ont été mis à niveau.
5. Des en-têtes globaux protègent désormais contre le MIME sniffing, le
   clickjacking, les référents excessifs et plusieurs permissions navigateur.
6. Les lectures critiques de l'accueil disposent d'un journal technique neutre
   pour diagnostiquer une panne sans exposer les données.

## Contrôles de sécurité confirmés

- refus par défaut et RLS sur les données applicatives ;
- séparation anonyme, praticien propriétaire, autre praticien et administrateur ;
- impossibilité de s'auto-promouvoir ou de modifier les crédits directement ;
- webhook Stripe signé, idempotent et rejouable sans double crédit ;
- limites partagées en base pour les formulaires publics ;
- fichiers actifs SVG refusés, images bornées et stockage isolé ;
- aucune clé réelle suivie par Git dans les chemins contrôlés ;
- erreurs publiques neutres et détails techniques limités aux journaux serveur.

## Risques résiduels et limites

- L'audit complet des dépendances de développement signale encore `braces`,
  transitivement utilisé par le linter Next. La version la plus récente de
  `eslint-config-next` est installée, mais l'écosystème ne fournit pas encore de
  correction compatible. Cette dépendance n'est pas livrée dans l'application ;
  l'arbre de production est propre.
- La table PostGIS `spatial_ref_sys` est une table technique publique, sans
  donnée utilisateur. Supabase la signale car elle n'a pas de RLS. Son
  déplacement ou son verrouillage doit être validé avec Supabase/PostGIS afin
  de ne pas casser les recherches géographiques.
- Les sauvegardes/restaurations Supabase, Stripe en mode test réel, l'envoi
  Resend réel et les navigateurs Firefox/WebKit restent des contrôles externes
  à planifier avant la mise en production finale.
- La conformité juridique finale des textes et durées de conservation reste à
  valider par le responsable du traitement ou son conseil.

## Porte avant envoi à Didier

- [ ] CI distante verte sur le commit livré ;
- [ ] prévisualisation Vercel redéployée ;
- [ ] smoke test post-déploiement des pages publiques, connexion et page de
      réinitialisation ;
- [ ] contrôle mobile et ordinateur de la prévisualisation ;
- [ ] aucun changement en production sans validation explicite de Rodrigue.
