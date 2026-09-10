# ForTheSoul — complément de recette du 10 septembre 2026

## Périmètre strict

1. Accueil FR/DE/EN : suppression des affirmations « toutes les expériences testées/vécues par Didier ». La validation personnelle reste indiquée ; la citation reprend celle de la page À propos.
2. Logo du pied de page : lien vers l’accueil, retour en haut depuis l’accueil, nom visible sur petit écran.
3. Filtre prix : libellé, seuils et puce suivent CHF/EUR et le taux existant. L’URL conserve les seuils CHF, donc le changement de devise ne change pas les résultats. La conversion des cartes existante n’est pas refaite.
4. Délistage : délai appliqué après la fin du séjour (début si sans fin). Une ancienne date de fin incohérente ne fait pas disparaître un événement futur. Aucun changement des dates du client.
5. Annuaire des lieux : publication explicite administrateur, indépendante de la validation de l’adresse avec une expérience. Une adresse validée reste disponible sur l’expérience sans publier automatiquement une fiche de lieu. Retrait réversible de l’annuaire ; aucun lieu supprimé. Les lieux existants publiés sont préservés.

## Vérifications avant push

- `npm run check` : lint, types, 266 tests / 46 fichiers réussis.
- `node scripts/qa.mjs build` : build optimisé réussi.
- `node scripts/qa.mjs web` : huit contrôles HTTP locaux réussis, fixtures temporaires nettoyées par identifiants.
- Navigateur local sur le build : seuil EUR puis CHF, puce cohérente ; logo footer ; textes d’accueil ; publication/retrait/republication du lieu fictif ; absence du lieu dans l’annuaire et 404 sur sa fiche lorsqu’il est retiré ; adresse et itinéraire toujours présents sur son expérience.
- Tests PostgreSQL : validation d’événement sans publication dans l’annuaire ; publication admin et refus d’auto-publication praticien.
- Migration additive `20260910090000_venue_directory_publication.sql` répétée sur copie restaurée : comparaison intégrale de toutes les lignes métier avant/après (seul le nouveau champ est exclu), neuf lieux existants conservés publiés. Même procédure passée sur le laboratoire local.
- Sauvegarde chiffrée fraîche de production du 10 septembre 10:38 UTC ; déchiffrement et empreinte vérifiés. Aucun reset, seed, import de QA ou nettoyage global.

## Déploiement

À compléter avec le commit et les contrôles réellement observés après mise en ligne.

## Limites et retour

Ce complément ne change pas les clés, DNS, paiements ou fournisseurs d’e-mails. Aucun paiement réel, campagne ou envoi client effectué. Les données client ambiguës (dont les dates Hawai’i) ne sont pas corrigées par supposition. Néo-Chamanisme et le nom après « Espace de » restent inchangés, suivant la validation de Rodrigue.

Migration additive : ne pas supprimer `is_public` pour un retour applicatif. Le build précédent fonctionne avec cette colonne, mais revient à l’ancien comportement de publication des lieux ; en tenir compte avant rollback. Ne pas rejouer les migrations historiques : registre réel `private.release_migration_log`.
