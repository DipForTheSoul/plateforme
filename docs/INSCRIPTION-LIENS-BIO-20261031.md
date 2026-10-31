# Inscription et biographie — recette locale du 31 octobre 2026

Branche : `codex/inscription-liens-bio-20261030`. Base : `fc72254f4d96faa58ac239876691afdd2eb73f05`.
Environnement : Next.js local port 3103 et Supabase de recette local, sans écriture en production.

## Correction

- Inscription : adresses de site et Instagram sans protocole normalisées en HTTPS, même validation sûre que le profil.
- Erreurs distinctes par champ en français, allemand et anglais ; une bio trop longue ne renvoie plus une erreur de lien.
- Compteur de caractères sur les biographies ; limites existantes conservées (inscription 40–1000, profil 4000).
- Saisie conservée après rejet de validation et erreur réseau ; aucun stockage ajouté des mots de passe.
- Aucun changement des statistiques, des rôles, des données existantes ou des migrations.

## Vérifications exécutées

- `npm run check` avec cache SWC temporaire : lint, TypeScript, 89 fichiers / 454 tests réussis.
- `node scripts/qa.mjs build` : compilation de production réussie (125 pages).
- `node scripts/qa.mjs verify` : 25 contrôles de recette réussis.
- Navigateur réel IAB, inscription allemande : bio de 1001 caractères rejetée avec message de bio et texte conservé ; adresse invalide rejetée avec message de lien ; adresse nue acceptée après correction.
- Inscription complète : compte et fiche en attente créés ; bio, site et Instagram vérifiés dans la base locale ; confirmation reçue dans Mailpit local. Compte temporaire supprimé après contrôle.
- Profil allemand : 4001 caractères rejetés avec le bon message et sans perte de texte ; bio valide et adresse nue enregistrées, puis vérifiées après rechargement. Valeurs initiales de la fiche QA restaurées et vérifiées.
- Formats 375, 820 et 1280 px : pas de débordement horizontal. Contrôle visuel mobile et tablette du profil ; compteur lisible. Capture : `output/inscription-bio-mobile-20261031.png`.
- `git diff --check` réussi. Onglet de recette fermé, aucun onglet de travail restant.

## Limites et livraison

Implémenté et testé localement ; **non déployé**. Aucun correctif annoncé comme actif sur le site de Didier.
Français/anglais et panne réseau couverts par tests automatisés, pas par un parcours navigateur complet supplémentaire. Aucun iPad physique ni Safari testé. Recette ciblée inscription/profil ; recette complète de livraison et retest sur la cible restent à effectuer avant publication.
