# Recette ciblée — brouillons persistants

Verdict de livraison : **RECETTE INCOMPLÈTE**. Le complément de développement est terminé et les scénarios locaux exécutés sont concluants ; cela ne vaut pas validation de la production ni nouvelle recette exhaustive de la plateforme.

8 septembre 2026. Base : `e14fb104cb9f266a7bf2cac8c46f712ebfc306e3`, branche `codex/audit-parcours-20260907`, complément décrit par le commit contenant ce dossier. Paquet Next testé : `NcIzUhL2hKRGDdtYa0RnL`. URL : http://localhost:3100. Recette + correction autorisées, objets fictifs locaux uniquement. Aucun déploiement client, aucune migration nouvelle.

## Périmètre

Complément des patches de Rodrigue : persistance après fermeture et abandon confirmé. Expériences (création/édition, praticien/admin), profil (praticien/admin), lieux (création/édition admin). Contact garde volontairement une sauvegarde d’onglet, sans persistance anonyme entre sessions. Pas de nouvelle recette exhaustive de l’ensemble de la plateforme.

Navigateur final : Google Chrome, piloté sur le Mac de Victor. Le navigateur intégré Codex a bloqué les interactions autour d’une confirmation native ; une confirmation dans la page a été développée puis les parcours rejoués dans Chrome. Son fonctionnement dans le navigateur intégré reste à revalider.

Services : vrai Supabase local (Auth, PostgreSQL, Storage), Mailpit local ; Stripe/Resend/MailerLite externes désactivés. Comptes fictifs : praticien, autre praticien, admin (identifiants dans QA-LOCAL.md, aucun secret dans les preuves). Desktop et petit écran : override demandé 390 × 844 ; mesure DOM effective 433 px de largeur, document 416 px. Pas de débordement global observé sur les trois types de formulaire ; la navigation admin reste une bande défilante. Ce n’est pas un essai sur iPhone/Safari réel. Override réinitialisé après recette.

## Catalogue de risques : applicabilité à cette modification

Applicables : INV, NAV (reprise/rechargement/abandon), AUTH (changement de session), DRO (compte et objet), FOR, BRO, FIC (références déjà téléversées), SAV, MOB, ACC, LOC, STA, CON, SEC, VIE (brouillon uniquement), DEP, EDI (conservation du texte).

Hors périmètre de cette recette ciblée : LIS, MET, TEM (calculs inchangés ; conservation des valeurs testée), RES, PAY, ABO, EMA, INT, IMP, GEO (géocodage inchangé), OBS, PER (pas de mesure de charge), COL, IA, DOM. Cette classification n’affirme pas que ces fonctions de la plateforme ont été revalidées ici.

## Garanties et limites

- Brouillons locaux, non synchronisés entre ordinateurs, restaurables sept jours après la dernière modification. Un effacement des données du navigateur ou un mode privé peut les faire disparaître.
- Isolation applicative par compte et objet ; ce stockage n’est pas chiffré et ne protège pas contre une personne ayant accès au profil navigateur ou aux outils développeur de cet ordinateur. Utiliser un profil navigateur personnel, pas un poste public partagé.
- Aucun mot de passe, fichier binaire ou jeton d’action dans les champs sauvegardés. Les URL des photos téléversées sont conservées ; les fichiers non encore envoyés ne sont pas restaurables.
- Un conflit local détecté bloque l’envoi et invite à copier le texte avant rechargement. Comparaison avant écriture et événement de stockage ; pas de verrou distribué ou promesse de collaboration simultanée temps réel.
- L’abandon efface le brouillon de ce formulaire après confirmation puis recharge les données serveur ; il ne supprime ni expérience, ni profil, ni lieu, ni photo du stockage distant.
- L’ancienne sauvegarde d’onglet des expériences est reprise à clé identique. Les anciennes clés non isolées des lieux et les anciennes clés de profil partagées avec l’admin ne sont pas importées automatiquement, pour éviter une reprise sous le mauvais compte.
- Les brouillons d’événements conservent leur version serveur d’origine pour la protection contre une édition concurrente. Pas de nouvelle garantie de concurrence serveur pour les profils ou lieux.

## Vérifications

- `npm run check` : lint et types valides, **180 tests / 33 fichiers**, dont 13 tests ajoutés pour ce complément. Ces tests ne sont pas 180 parcours navigateur.
- Build local connecté réussi ; parcours finaux exécutés sur ce build, pas uniquement sur le serveur de développement.
- **8 contextes de formulaires inventoriés et visités**, regroupés en trois composants : création/édition expérience praticien, création/édition expérience admin, profil praticien, profil admin, création/édition lieu admin.
- Registre de scénarios et observations : [COUVERTURE.csv](COUVERTURE.csv). Preuves textuelles expurgées : [PREUVES.md](PREUVES.md). Écarts et retests : [ANOMALIES.md](ANOMALIES.md).
- Registre : **20 PASS, 0 FAIL, 2 BLOQUÉ, 5 NON TESTÉ, 0 N/A**. Ce sont des scénarios ciblés, pas un décompte exhaustif des clics ou des fonctions de la plateforme. Le nombre total d’actions historiques applicables n’a pas été réinventorié dans ce complément.
- Les actions modifiées ont été exercées : saisie déclenchant la sauvegarde, abandon, annulation, confirmation, fermeture par Échap, conflit et rechargement. Les envois expérience praticien et profil praticien ont été vérifiés jusque dans les données réouvertes. Le registre ne prétend pas compter chaque bouton historique du site.

### Informations récupérées des patches de Rodrigue

Les besoins de brouillons, URL naturelles et récurrences modifiables sont conservés. Les URL et la gestion transactionnelle des séries étaient déjà traitées dans la branche d’audit ; les patches ne sont pas appliqués aveuglément par-dessus. Ce complément ajoute la persistance entre sessions, une action d’abandon explicite et les protections de compte/objet/conflit. L’ancienne suppression puis recréation non transactionnelle des occurrences n’est pas réintroduite.

### Données de recette conservées

- Nouvelle expérience fictive : `af77a791-19fe-469b-813a-a3ea7480eda6`, titre « QA brouillon version A finale », quatre dates à 11 h du 9 au 30 octobre 2026, durée 1,5 h, photo issue du logo public local. Un seul crédit consommé : solde de 19 à 18.
- Profil fictif Praticien QA : biographie enregistrée « QA 08-09 — profil persistant vérifié dans Chrome. ». Un brouillon privé supplémentaire « QA brouillon privé praticien non envoyé » reste dans le profil Chrome de recette pour démontrer l’isolation admin/praticien.
- Le lieu `b0000000-0000-4000-8000-000000000001` conserve son nom « Salle fictive QA » et son adresse initiale. Aucun lieu créé par les essais de brouillons. Les brouillons admin ont été abandonnés et le retour aux données serveur vérifié.

### Réserves et suite

Les pannes de stockage, expiration et conflit détecté exactement au clic sont couverts par tests automatisés, pas par injection dans Chrome. La fermeture d’un onglet puis l’ouverture d’un nouveau a été exécutée ; l’arrêt complet du processus Chrome et son redémarrage ne l’ont pas été. Safari, appareils physiques, autres variantes de langues et les parcours historiques non modifiés ne sont pas recertifiés ici.

La suite est de reprendre la branche et son dossier QA dans l’environnement de Rodrigue, puis de faire la bascule coordonnée décrite dans l’audit initial et une recette sur l’environnement client. Ne pas confondre ce complément local validé avec une livraison client autorisée ou « zéro bug ».
