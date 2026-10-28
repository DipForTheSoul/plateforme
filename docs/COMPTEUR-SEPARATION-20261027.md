# Séparation du compteur interne et de Google — 27 octobre 2026

Demande autorisée : conserver les navigateurs estimés et leur historique, séparer de Google, tester puis publier. Ne pas ajouter de compteur de pages ni remettre les données à zéro. Aucun mail à envoyer.

Version examinée : fc72254f4d96faa58ac239876691afdd2eb73f05, worktree correctifs-rabais-20261023. Aucun changement de production effectué pendant cette reprise.

## Constats vérifiés dans le code

- PageViewTracker.tsx et /api/views partagent actuellement fts-audience-consent-v2 avec GoogleAnalytics.tsx.
- Le navigateur contient un UUID renouvelé après 30 jours. Le serveur conserve cet UUID avec le jour, et dans audience_page_visitors avec le chemin de chaque page. Ce n'est pas une simple somme anonyme.
- get_admin_visitors déduplique les UUID sur les 30 derniers jours ; cette fenêtre n'est pas une suppression des anciennes données. Aucune purge de ces tables n'a été trouvée dans les migrations du dépôt. Les tâches distantes de production restent NON VÉRIFIÉES.
- Un refus Google actuel efface aussi l'identifiant interne. Il faut préserver les refus historiques lors de toute séparation, et éviter qu'un refus Google futur réinitialise cet identifiant.

## Vérification réglementaire et limite de livraison

Source primaire consultée le 27 octobre : PFPDT, Guide relatif aux traitements de données au moyen de cookies et technologies similaires, version du 6 octobre 2025, sections 3.7 à 3.10 : https://www.edoeb.admin.ch/fr/cookies-conseils-pratiques (lien vers le guide).

Une mesure statistique peut bénéficier d'un traitement distinct du consentement publicitaire, sous conditions. Cela ne constitue pas une exemption automatique de l'identifiant persistant et de l'historique des pages. Il faut qualifier la minimisation/anonymisation, la conservation, le droit d'opposition et l'absence de traitement sensible. Le contexte des fiches de bien-être et de pratiques spirituelles interdit de supposer que tous les chemins sont dépourvus de caractère sensible. Ceci est une limite d'analyse, pas une conclusion juridique que toute mesure serait interdite.

NO-GO pour simplement supprimer le test de consentement de l'implémentation actuelle. Il reste à définir et vérifier un comptage statistique découplé qui ne conserve pas un parcours identifiable sans consentement, avec opposition indépendante, conservation bornée et maintien des agrégats historiques. Les exigences de conservation des chiffres ne doivent pas être confondues avec une nécessité de conserver indéfiniment les identifiants bruts.

## Actions de cette reprise

Retrait des seuls brouillons locaux du compteur supplémentaire de pages (AggregatePages, AggregatePageCounter, PageCountPreference, APIs page-counts/page-count-preference, lib/page-counts, migration 20261027164532 non appliquée et leurs tests). Retrait de leurs imports dans layout/admin/confidentialite. Ces fichiers avaient été créés par l'agent pour une solution abandonnée ; aucune donnée client ni migration appliquée n'a été supprimée. Les autres changements locaux et les preuves SEO sont conservés.

Implémentation de séparation : NON TERMINÉE. Tests du nouveau comportement : NON TESTÉS. Déploiement : NON EFFECTUÉ. Aucun texte client ne doit annoncer une publication ou une validation du compteur.

## Reprise du 28 octobre — réalisation en cours

La limite du 27 octobre est traitée par une nouvelle configuration statistique, et non par la simple suppression du test de consentement. Les données des tables historiques sont conservées intégralement. Le navigateur existant garde sa clé et sa date d’expiration ; le total courant est l’union dédupliquée de l’ancien et du nouveau stockage, jamais leur somme.

Finalité : estimation statistique de l’audience du site suisse décrit au brief, sans publicité personnalisée, rapprochement avec comptes, réutilisation Meta/Google ou analyse individuelle d’intérêts. Justification technique correspondant aux conditions étudiées dans le guide PFPDT §3.8.2 et §3.9 : l’UUID est nécessaire temporairement pour dédupliquer sur 30 jours ; aucune identité civile ou IP brute n’est stockée avec lui. Les jetons des pages utilisent un HMAC propre au jour et au chemin, avec clé uniquement sur le serveur applicatif ; les lignes ne permettent pas de joindre les parcours dans la base. Ce sont des données pseudonymes pendant la fenêtre active, pas une promesse d’anonymat absolu. Les nouveaux relevés expirés sont archivés chaque heure sous forme de totaux journaliers sans identifiant. Les sauvegardes techniques restent soumises à la rétention du fournisseur ; elles ne sont pas modifiées par ce lot. L’historique ancien, collecté après consentement, est conservé. Cette conception constitue une appréciation technique étayée, pas une certification juridique générale ni une exemption valable pour toute juridiction ou tout usage futur.

Une information et un bouton d’opposition sont rendus avant le démarrage client. Le choix interne possède une clé distincte ; tout ancien refus devient une opposition interne conservée jusqu’à changement explicite. Le refus ultérieur de Google ne modifie ni l’identité ni le choix interne. Le retrait interne n’affecte pas le choix Google et retire l’identifiant local. Aucun comptage si stockage bloqué. Les contrôles bots/préchargements/previews/comptes connectés/origine/rate limit sont conservés.

Stockage : migration additive 20261028091124_separate_internal_audience.sql ; tables internes protégées par RLS, écritures atomiques par RPC invoker accessible seulement au service serveur ; lecteurs administrateurs seulement et refus explicite du résultat NULL. Conservation nouvelle : fenêtre de dates d’environ 31 jours, archivage horaire ; chiffres agrégés conservés, sans réinitialisation. Les totaux journaliers archivés ne doivent pas être additionnés pour prétendre donner des personnes uniques sur plusieurs mois.

Base production avant changement, lecture SQL du 28 octobre : 41 relevés visiteurs / 34 navigateurs distincts, 111 relevés de pages, 43321 anciennes page_views, somme des vues des fiches 6779, started_at 2026-10-17T16:17:37.585094Z. pg_cron disponible mais pas encore activé. Aucune purge programmée existante dans ce schéma (cron.job absent).

Tests de code : npm run check PASS, 89 fichiers / 456 tests ; compilation connectée à Supabase local PASS ; audit dépendances production 0 vulnérabilité signalée. Les premiers échecs étaient des sélecteurs de libellés modifiés et l’absence de propriété webdriver dans jsdom, corrigés dans les fixtures. Migration entière appliquée sur PostgreSQL Supabase local ; tâche de conservation active. API réelle locale : répétition et seconde page HTTP 200, une seule identité distincte / deux pages ; opposition, ancien refus, robot et cookie de compte connecté HTTP 204. Aucun de ces succès ne constitue encore une vérification de production.

Recette : Chrome réel via extension, préférences internes activées/désactivées et rechargées. Contrôle d’une visite visible encore à confirmer : l’onglet de recette est masqué pendant une partie des manipulations et le compteur exclut explicitement les onglets masqués. Aucune simulation de visite humaine par désactivation de webdriver. Google reste absent dans le bac local dont l’ID est vide ; les quatre combinaisons des choix sont couvertes par les tests de composants et d’API. Viewport mobile/tablette en cours ; appareils physiques/Safari NON TESTÉS à ce stade.

Périmètre du registre : INV/NAV/STA/OBS/SEC/DRO/CON/INT/VIE/TEM/DEP/MOB/ACC/LOC/SAV/PER applicables au compteur, aux préférences communes et à la conservation ; GEO/LIS concernés pour la non-régression des pages Lieux/catalogues. AUTH/PAY/ABO/EMA/BRO/FIC/MET/IMP/EDI : systèmes présents mais code métier indépendant inchangé ; réutilisation des preuves antérieures seulement lorsqu’elles restent indépendantes, sans nouvelle validation exhaustive. RES/COL/IA/DOM non ajoutés. Aucun paiement, message réel, modification de profil, suppression de données client ni renouvellement d’accès réalisé pour ce lot.

Retour arrière : revenir aux composants/route antérieurs en conservant les tables nouvelles et les fonctions de lecture UNION. Ne pas annuler la migration en supprimant les nouvelles données : la lecture union maintient les chiffres même si le caller ancien reprend ses écritures consenties dans le stockage historique. Aucun rollback global vers une ancienne version du site.

Publication et vérification cible : EN ATTENTE. Aucun mail envoyé.

## Changement de périmètre explicite du 28 octobre, après les captures Reventury

Rodrigue demande maintenant une réalisation UNIQUEMENT LOCALE. Toute publication de code, preview distante et migration de production est suspendue. Aucune migration de ce chantier n'a été appliquée en production. Les lectures SQL et l'administration de production ci-dessus restent des baselines ; le travail continue dans la base QA isolée.

Résultat demandé : acquisition Publicités / Google en haut, puis suivi détaillé dessous avec visiteurs estimés, véritables affichages de pages, inscriptions observées et taux ; reprendre les informations utiles du suivi Reventury, dans la charte ForTheSoul. Idée d'un futur onglet SEO seulement : pas de module SEO/ranking à construire dans ce lot. Aucun raccordement Google/Meta nouveau, aucun service payant.

Échange explicitement autorisé et réalisé avec « Travel Planner - reventurytravel.com », thread01a08514-04ce-7793-a512-aa4c9bc34906, réponses du28octobre. Les chiffres Reventury proviennent du suivi interne/profils, pas de GA4. La référence a des limites confirmées par son agent : identifiant journalier compté comme unique sur30jours, trafic admin inclus, accounts.google.com reconnu comme Google naturel, taux calculé entre volumes non reliés. Aucune modification de Reventury autorisée ou effectuée. Reprendre sa clarté et ses fonctions, pas ces ambiguïtés ni ses chiffres. Sources de code indiquées par l'agent : APPLICATION/Plateforme restauree Shopify/lib/data/audience.ts, app/api/hit/route.ts et components/analytics/Tracker.tsx dans /Users/rodrigue/Desktop/REVENTURY.

Définitions à implémenter en local : navigateur persistant et dédupliqué sur la période ; vrai page_view à chaque navigation/rechargement avec ID de requête anti-doublon ; origine collectée à l'arrivée (UTM/referrer normalisés, aucun identifiant publicitaire brut stocké), Google Ads distinct du moteur naturel, réseaux sociaux payants seulement avec signal suffisant ; inscription après succès serveur et taux basé sur les navigateurs mesurés réellement inscrits. Origines et conversions non mesurées dans l'ancien historique restent inconnues, jamais inventées. Les périodes7/30/90 doivent indiquer leur couverture réelle. La conservation nouvelle devra correspondre à la période90jours proposée, avec archivage de totaux anonymes au-delà ; décision à documenter dans la version locale avant tout éventuel déploiement ultérieur.

## Réalisation locale et autorisation d’aperçu — 28 octobre, fin de matinée

Rodrigue autorise maintenant un lien de prévisualisation pour validation de Didier avant décision de publication. Aucune autorisation de production dans ce dernier périmètre. `/apercu-suivi` est une proposition avec données d’exemple explicitement signalées, sans lecture de statistiques clientes ; elle est indisponible en environnement production. Les vraies nouvelles fonctions SQL restent appliquées uniquement au Supabase QA local. Les deux trackers ne sont pas chargés sur Vercel preview.

Implémentation locale : suivi 7/30/90 jours, acquisition identifiée, pages réellement affichées avec anti-retry, navigateurs dédupliqués avec l’ancien historique, créations de compte suivies et taux sur la même cohorte. L’identifiant navigateur existant et son expiration de 30 jours restent conservés. La rétention des nouvelles lignes passe à 91 jours maximum pour couvrir les périodes proposées ; totaux archivés sans identifiant, y compris inscriptions. Les anciennes tables et leurs valeurs sont intactes. Les anciens relevés par page restent en base et dans leur ancienne fonction de lecture ; ils ne sont pas transformés fictivement en vrais page_view.

PASS : `npm run check`, 92 fichiers et 480 tests ; build local connecté, 132 routes. Tests SQL : migration additive, transition ancien/nouveau navigateur, absence de double compte, répétitions de pages, idempotence des requêtes, périodes, RLS, archivage sans suppression de chiffres historiques. Tests inscription : succès, adresse déjà inscrite, opposition, panne secondaire et exclusion preview. `node scripts/qa.mjs audience` vérifie la base QA réelle : 13 visiteurs sur 7 jours, 16 sur 30/90, 36 pages, 3 inscriptions suivies, 23,1 % sur 13 navigateurs de la nouvelle cohorte, 5 publicité et 3 Google. Ce sont uniquement des données de recette.

PASS navigateur Chrome réel : connexion administrateur local, lecture des mêmes chiffres, filtres 7/30/90, rendu sans débordement horizontal aux largeurs CSS 312, 819 et 1280. Les grands paragraphes sont remplacés, à la demande de Rodrigue, par une bulle par carte. Ouverture au clic, fermeture Échap et clic extérieur, bulle mobile contenue dans la largeur observée (312 px). Preuve : output/suivi-bulle-mobile-20261028.png. Vérification tactile sur appareils physiques et Safari : NON TESTÉE. Une réduction Chrome ne constitue pas une validation Safari/iPad.

La preview valide la présentation ; elle ne prouve pas une collecte en production. Toute publication ultérieure nécessitera retest du navigateur public visible jusqu’à sa donnée durable, contrôle de la migration sur la cible et vérification des compteurs avant/après. Aucun chiffre ne doit être remis à zéro et aucune donnée d’exemple ne doit être copiée dans la base cliente.
