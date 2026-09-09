# Recette des demandes email Didier

> Transmission ultérieure du 9 septembre : le commit applicatif `7fba090` a été poussé sur la branche client et déployé en Preview protégée, avec contrôles GitHub réussis. Le rapport ci-dessous conserve l’état de clôture de la recette locale. Pour reprendre et connaître les blocages distants, lire d’abord [REPRISE-RODRIGUE.md](../../REPRISE-RODRIGUE.md).

Recette locale terminée le 9 septembre 2026, sur la branche `codex/audit-parcours-20260907`, à partir de `9460277`. **Développé et vérifié localement ; non publié sur main, Vercel ou Supabase client.**

Victor confirme que les six pages PDF constituent le lot complet ; les autres pages sont d’anciennes demandes. Ajouts autorisés : description enrichie et lien externe dédié, titre simple selon la proposition acceptée. Registre source : [analyse D01–D13](../../ANALYSE-DEMANDES-CLIENT-2026-09-08.md).

## Résultat des demandes

| Demande | Livraison et preuve |
| --- | --- |
| D01 Mobile | Grilles, textes longs, dates libres et en-tête corrigés. Mesures navigateur de 320 à 1280 px sans dépassement global sur les surfaces testées. Pas de certification iPhone physique. |
| D02 Heure suisse | Dépôt puis réouverture à 11:11, dates récurrentes conservées ; heure d’hiver/été couverte aussi par les tests. |
| D03 Durée en heures | 1.5 h enregistrée comme 90 minutes ; fiche 11:11 → 12:41, durée 1 h 30. |
| D04 Dates de série | Liste complète avec date racine et répétitions ; hebdomadaire, bimensuelle au sens toutes les deux semaines, mensuelle et dates libres exercées. |
| D05 Supprimer une date | Double suppression successive corrigée et rejouée ; suppression de racine praticien conserve les autres dates. Vraie saisie non enregistrée protégée. |
| D06 Créer le lieu violet | Bouton ciblé violet, ouverture/fermetures/création réelle du lieu et sélection automatique testées. |
| D07 Aide récurrence | Aide déplacée dans le bloc récurrence et rendue lisible ; traductions FR/DE/EN. |
| D08 Plusieurs jours | Durée horaire masquée et désactivée, valeur conservée en revenant à la journée ; le serveur ne stocke pas une durée périmée avec une date de fin. |
| D09 Début et fin | Deux dates et deux heures sur fiche, carte de catalogue, vue géographique et message de réservation. |
| D10 Deux jours | Séjour 17/10 10 h → 18/10 16 h : 2 jours calendaires, en FR/DE/EN ; agenda conserve les vrais instants. |
| D11 Description | Gras, italique, souligné, listes, liens, huit emojis et aperçu. Chaque commande exercée. Syntaxe légère avec aperçu, pas un traitement de texte complet ni du HTML libre. |
| D12 Titre | Conservé en texte simple selon l’arbitrage proposé ; **pas de barre d’outils de titre**. |
| D13 Lien dédié | Champ d’inscription/document séparé de la vidéo ; validation HTTP(S), ajout automatique du protocole, brouillon, persistance, copie/effacement dans les dates ; bouton public distinct de Réserver. Ouverture du site externe non observable dans le pilote intégré (voir limites). |

Les essais ont également révélé puis corrigé : la perte du gras lors de l’ajout d’italique, le faux brouillon après retrait d’une date, la navigation desktop trop large sur tablette, l’écrasement des filtres rapides et le conflit Liste/Carte + calendrier. [Registre des anomalies](ANOMALIES.md).

## Terrain et interfaces à tester

Mode correction + recette locale, localhost:3100, vrai Supabase local fictif / Mailpit, aucun projet client ni message réel. Interfaces approuvées : formulaire expérience (création et édition admin/praticien), rendu public/cartes et agenda, panneau de lieu, actions de série, éditeur et lien externe. Les tests automatisés ciblent ces interfaces et la transaction SQL de sauvegarde/lecture ; la recette réelle vérifie les boutons, la persistance et les erreurs. Pas d’extension du scope à la facturation ou à des modules historiques sans rapport avec ce lot.

Chrome n’était pas exposé par le pilote ; les vrais parcours ont été effectués dans le navigateur intégré du Mac de Victor. Comptes administrateur et praticien, puis consultation publique. Données fictives « QA Didier 09-09 », aucune modification des données client.

La méthode de recette navigateur a guidé l’inventaire des commandes, les erreurs provoquées et les retests après correction ; la méthode de tests de régression a ajouté des tests en échec avant correction des comportements reproduits. La vérification SQL a imposé une migration atomique et un contrôle de cohérence réel de la base.

## Vérifications réalisées

- **192 tests automatisés réussis**, lint et typage réussis ; 31 tests SQL inclus. Ils ne sont pas comptés comme des parcours navigateur.
- **25 contrôles connectés** Auth/Postgres/Storage/PostGIS/concurrence ; **8 Auth** via Mailpit/PKCE ; **8 HTTP** via l’application réelle : réussis.
- Compilation finale réussie et serveur relancé avec le paquet compilé pour les retests.
- Audit des dépendances : aucune vulnérabilité signalée au contrôle final.
- Saisie, erreur de validation, mauvais fichier photo, nouveau lieu, changements de langue, sauvegarde, réouverture, récurrences, suppressions, rendu public, favoris, agenda, carte et filtres réellement manipulés.
- Panne réelle provoquée en arrêtant le serveur pendant un dépôt praticien : texte et sélections conservés, restauration après rechargement, nouvelle tentative réussie avec un seul crédit débité.
- Comparaison SQL locale après rejeu de toutes les migrations : aucun écart de schéma public.

Le détail par commande/scénario figure dans [COUVERTURE.csv](COUVERTURE.csv), avec le [journal de preuves](PREUVES.md). Les captures natives se trouvent dans la conversation, pas dans des fichiers PNG inventés.

## Catalogue de risques

Applicables dans le périmètre : INV, NAV, AUTH (connexion/déconnexion), DRO, FOR, BRO, FIC, SAV, LIS (cartes/recherche), MET (soumission/modération), TEM, PAY (débit de publication, pas Stripe), EMA (notification locale), INT (services locaux), IMP (agenda), MOB, ACC, LOC, GEO (ajout lieu), STA (favoris liés aux cartes), CON, SEC, VIE, OBS (compteurs de dates), PER (texte long/réactivité), DEP, EDI.

Non applicables à ce lot : RES (pas de réservation intégrée), ABO (pas d’abonnement), COL (pas de messagerie collaborative), IA, DOM (aucun nouveau module métier). Les contrôles externes production, paiement Stripe, appareil physique et lecteur d’écran restent distincts des preuves locales.

## Limites et réserves explicites

- Aucun défaut bloquant encore reproduit dans les scénarios du lot à la clôture. Cela n’est pas une garantie d’absence de bugs ni une recette exhaustive de toute la plateforme historique.
- Lien externe public activé au clic puis au clavier ; href/target/rel et persistance contrôlés. Le pilote ne remonte pas sa fenêtre externe : le chargement final chez le destinataire n’est **pas** attesté.
- Agenda ICS et URL Google vérifiés, mais pas d’import dans un vrai compte Apple/Google/Outlook. Réserver contrôlé comme lien email, sans envoi à un client.
- Pas d’appareil iPhone 17 physique, Safari, lecteur d’écran ni vraie permission de géolocalisation utilisateur testés dans ce lot. Les largeurs mobiles sont réelles dans le navigateur disponible, sans émulation prétendue du moteur Safari.
- Pas de Stripe, Resend/MailerLite, Vercel ou Supabase client réel testés ici. Les tests connectés utilisent les services fictifs locaux. Les secrets et données clients ne sont pas dans le dépôt.
- Les contrôles SQL signalent des avertissements préexistants de l’extension PostGIS (`spatial_ref_sys` notamment) ; pas de modification arbitraire de l’extension pour masquer ces avertissements.

## Mise en ligne et reprise

1. Reprendre **cette branche d’audit**, pas l’ancien dossier `/Users/victorltd/Desktop/Forthesoul`. Les patches de Rodrigue ne doivent pas être réappliqués aveuglément par-dessus les corrections intégrées.
2. Vérifier les migrations présentes sur **le projet client exact** et sauvegarder avant migration. Appliquer dans l’ordre les migrations d’audit manquantes, puis `20260908170656_client_external_event_link.sql`, avant de déployer le code de ce lot. La nouvelle migration ajoute `events.external_url` et conserve les règles d’autorisation, crédits, concurrence et récurrence de la transaction existante.
3. Refaire sur la préproduction cliente les contrôles dépendant de son environnement (Auth/URLs de retour, stockage, migrations, liens externes, email, mobile Safari). Les preuves locales ne valent pas confirmation d’une connexion cloud différente.
4. Déployer ensuite la version vérifiée, puis une courte recette de non-régression sur les parcours critiques. Aucune publication ni fusion main n’a été faite durant ce lot.

Comptes fictifs et démarrage : [QA-LOCAL.md](../../QA-LOCAL.md). `localhost:3100` ne peut être ouvert depuis le Mac de Rodrigue sans qu’il recrée son environnement.

Les seuls éléments retirés pendant les essais sont des brouillons/dates **fictifs de recette** et les fixtures temporaires des scripts. Les comptes et expériences de démonstration restants sont conservés ; aucune suppression client. Les suppressions de dates fictives ne disposent pas de corbeille applicative, mais leurs valeurs sont consignées dans le journal pour les recréer.
