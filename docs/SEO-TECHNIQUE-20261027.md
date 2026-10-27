# SEO technique — lot minimal du 27 octobre 2026

Autorisation : corriger le SEO technique, publier, vérifier, rédiger le mail ici sans l'envoyer. Limite ajoutée : minimum prévu au brief. BUILD-BRIEF phases 8 et 9 incluent hreflang, métadonnées, Schema.org, sitemap et robots ; pas de campagne SEO ni module éditorial.

Base : main 1c28ff6, totalité de la prévisualisation antérieure conservée. Aucune migration, aucun changement d'URL existante, de prix, de date ni de texte client. Aucun changement de consentement.

Reproduction production avant correction : fiche Danse Soufie ec05b014-34b9-4fe3-8183-025707b5c04c et catalogues renvoient canonical vers accueil ; version DE vers accueil DE. Cause : alternates du layout hérités par les pages. Défaut de signal d'indexation prouvé ; effet réel dans Google NON TESTÉ sans Search Console.

Correction : helper commun, canonical et hreflang des pages principales/fiches ; accueil déclaré seulement sur sa propre page ; origine www cohérente avec redirection publique ; Event PostalAddress avec ville/canton/pays existants et description lisible. Les pages non couvertes n'héritent plus d'une fausse canonical accueil.

Tests : lint et types réussis ; suite initiale 432 PASS/3 FAIL dus au mock navigation NextIntl manquant dans les nouveaux tests ; mock adapté. Tests SEO ciblés 8 PASS. Compilation locale réussie, avec avertissements d'accès Supabase absent dans ce checkout (ne valide pas les lectures distantes). Résultat de suite complète et recette distante à compléter.

Inventaire des familles : INV/NAV/LIS/LOC/GEO/DEP/EDI applicables au lot (lecture publique, navigation, langue, identité SEO, adresse). AUTH/DRO/FOR/BRO/FIC/SAV/MET/TEM/PAY/ABO/EMA/INT/IMP/MOB/ACC/STA/CON/SEC/VIE/OBS/PER : code métier inchangé ; preuves existantes indépendantes à conserver, pas de prétendue nouvelle recette exhaustive. RES/COL/IA/DOM : aucune fonctionnalité ajoutée dans ce lot. Les tests réels de paiement, e-mails et écritures administrateur ne sont pas relancés en production. Aucune cible mobile/Safari réelle certifiée.

Limites : Search Console/indexation réelle, Rich Results Google et amélioration de classement NON TESTÉS. Date de la fiche à confirmer par le propriétaire : startDate 24 novembre, texte mentionnant 28 novembre ; ne pas la changer par supposition. Audit Supabase et alertes antérieurs restent ouverts : aucune validation globale de plateforme.

Déploiement : EN ATTENTE. Retour arrière du lot par revert du commit SEO uniquement, sans restaurer une vieille version complète ni toucher la base.
