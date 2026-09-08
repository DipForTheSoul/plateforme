# Journal de preuves — recette locale

Les essais ci-dessous ont été réalisés dans le navigateur intégré du Mac, sur le paquet compilé servi à localhost:3100, avec Supabase local réel. Les captures affichées dans la conversation et les relevés DOM proviennent de ce navigateur, pas d’un rendu simulé. Les premiers contrôles ont été suivis de reconstructions pour les corrections EDI-01 et MOB-01/02 ; voir le rapport final pour le dernier passage.

## Séjour administrateur

- Compte admin@forthesoul.test. Expérience `2e4f8a20-5cf6-4502-ad06-f46b43225bcd`, URL publique `/experiences/experience-2002f06a-ca1a-48c3-b039-8c4eff3a05d8`.
- Titre : QA Didier 09-09 — Séjour 17 et 18 octobre.
- Boutons Gras, Italique, Souligné, Liste, Lien externe, Emoji et Aperçu cliqués. Huit emojis insérés un par un ; annulations des deux panneaux testées. Lien javascript refusé sans modification du texte ; lien avec parenthèses normalisé en `%28`/`%29` et rendu sûr dans l’aperçu.
- Mode journée : 1.5 h ; mode plusieurs jours : durée cachée/désactivée ; retour journée : 1.5 conservé. Début 17/10/2026 10:00, fin 18/10/2026 16:00.
- Soumission sans univers et avec lien dangereux : erreurs explicites ; titre, description, inclus/apporter et dates conservés.
- Ajout du lieu : boutons d’ouverture, deux fermetures, création testés. Couleur calculée Créer le lieu : rgb(94,77,158), texte blanc. Lieu `98e4249c-b38f-470f-b46c-794e47d7fa25`, Place de la Gare 1, 1003 Lausanne ; sélection automatique, texte principal conservé.
- Passage DE, rechargement, puis EN et FR : texte, dates, lien et lieu restaurés après hydratation. Un instantané pris immédiatement après rechargement montre les champs avant restauration ; le contrôle suivant confirme leur restauration, sans action de ressaisie.
- SVG refusé avec message ; JPEG cat-yoga.jpg téléversé. Création réussie et réouverture : une photo, URL externe https://example.com/, mêmes dates/heures, aucune durée horaire enregistrée.
- Base réelle : start_date 2026-10-17T08:00Z, end_date 2026-10-18T14:00Z, duration_minutes NULL, statut approved.
- Modification après publication en série hebdomadaire 4 dates : 17/10, 24/10, 31/10, 07/11 à 10 h suisses. Retrait du 24 puis du 31, sans rechargement : restent 17/10 et 07/11. Une saisie non enregistrée bloque volontairement le retrait suivant avec explication ; sauvegarde ensuite réussie.
- Fiche publique et cartes : deux extrémités complètes ; 2 jours calendaires / 2 Kalendertage / 2 calendar days. Liens Réserver et externe distincts. Le courriel prérempli contient aussi les deux heures.
- Clic sur lien externe effectué ; attributs href, target=_blank et rel contrôlés. Aucun nouvel onglet externe n’est remonté par le pilote intégré : l’ouverture finale dans un navigateur externe ne doit pas être prétendue vérifiée.
- Menu agenda et lien ICS cliqués. Réponse ICS contrôlée : DTSTART 20261017T080000Z, DTEND 20261018T140000Z ; description sans marqueurs et repliement des lignes correct. Import dans Apple/Google/Outlook non effectué.
- Favori ajouté puis retiré sur la carte. À 390 px, cartes de 343 px et largeur document 384 px, pas de débordement global.

## Praticien, panne et taille mobile

- Compte praticien@forthesoul.test, solde initial 18 : les créations/modifications administrateur n’ont pas consommé de crédit.
- Ancien brouillon fictif QA compilation finale 12h10 : abandon annulé (titre conservé), puis confirmé. Seul ce brouillon local a été effacé, pas les expériences enregistrées.
- Nouveau titre long sans espaces, texte enrichi, heure 11:11, durée 1.5, prix 45, lien www.example.com, dates libres 9 et 30 octobre.
- Ajout puis suppression d’un champ de date vide : la date utile du 30 reste présente.
- Arrêt volontaire du serveur Next puis clic Déposer : message « Enregistrement non confirmé » ; tous les champs relus identiques. Reconstruction/redémarrage et rechargement : brouillon retrouvé, y compris date libre et lien.
- Mesures mobiles ont déclenché les corrections MOB-01 et MOB-02, pas une simple dissimulation du défilement horizontal.

## Sauvegarde, dates et crédits après redémarrage

- Le nouveau dépôt praticien est confirmé : dates libres 9 et 30 octobre à 11:11, duration_minutes 90, statut pending ; crédit 18 → 17, un seul débit. Texte enrichi et URL retrouvés après réouverture.
- Modification en récurrence toutes les deux semaines, quatre dates : 9/10, 23/10, 6/11, 20/11, toutes à 11:11. Modification sans crédit supplémentaire.
- Suppression de la première date depuis l’édition praticien, par activation clavier du bouton : nouvelle racine `98fd1ee3-dd2d-42bc-b43b-95e3ce17064a`, trois dates restantes. Le premier clic pointeur n’avait pas activé l’action ; aucune suppression ne lui est attribuée.
- Administration : approbation de cette seule série fictive, puis récurrence mensuelle trois dates à partir du 31 octobre : 31/10, 30/11, 31/12, même heure 11:11. Vidage volontaire du lien externe puis sauvegarde, restauration du lien puis sauvegarde : opérations confirmées.
- Fiche `/experiences/experience-a0840b26-e8bb-491e-9de8-c7586c1e11ed` : « de 11:11 → 12:41 · durée 1 h 30 », gras Important, italique Doux, élément `u` Souligné, emoji et liste Tapis/Eau. Titre long reste du texte, aucune syntaxe HTML exécutée.

## Paquet final, catalogue et navigation

- Six sélections successives, sans attendre la réponse serveur, aboutissent à `?categorie=yoga-somatique&langue=fr&praticien=praticien-qa&pays=CH&prix=50&duree=90`. Les six menus relus confirment les valeurs.
- Canton VD ajouté, puce prix retirée : tous les autres filtres conservés. Réinitialiser : URL `/experiences`, tous les menus vides. Recherche Séjour : deux dates correspondantes seulement ; remise à zéro effective.
- Vue carte : huit résultats fictifs, marqueur ouvert puis fermé, zoom +/− activés. Le popup du séjour affiche « Samedi 17.10.2026 · 10:00 → Dimanche 18.10.2026 · 16:00 ». Même texte dans le résultat latéral. Retour Liste testé.
- Calendrier mois suivant, puis 17 et 18 octobre : une seule expérience de séjour. Enchaînement rapide final Carte + bouton 17 : URL `?vue=carte&du=2026-10-17`, carte visible. Liste + bouton 18 : URL `?du=2026-10-17&au=2026-10-18`, liste visible. Les tentatives de remplissage direct de l’input date par le pilote n’avaient pas changé les dates : ce sont les boutons calendrier qui apportent la preuve réelle de ce scénario.
- Lien externe dédié : activation par clic puis Entrée, URL `https://example.com/`, target `_blank`, rel `noopener noreferrer`. Aucun onglet externe remonté au pilote ; destination finale hors navigateur intégré non observée, limite explicite.
- Largeurs finales `viewport / clientWidth / scrollWidth` : fiche longue 320/305/305 puis 430/415/415 ; catalogue carte 390/375/375 ; en-tête/catalogue allemand 1280/1265/1265. Contrôles antérieurs après correction : 375/360/360, 768/753/753. Barre de défilement verticale de 15 px, pas de dépassement horizontal. Les mesures ont été prises après stabilisation de chaque changement de largeur.
- Menu compact ouvert/fermé à 320 et 768 ; menu bureau allemand présent à 1280. Captures natives affichées dans la conversation. Pas de simulation prétendue d’un iPhone physique.
- Dernier contrôle photo sur le séjour admin : Retirer cette image fait passer les images du formulaire de 1 à 0, sans perte de texte ni de lien. Abandon de ce seul brouillon confirmé : la photo serveur revient (1), texte et lien identiques. Retrait non sauvegardé intentionnellement pour conserver la démonstration. Aperçu final ouvert et fermé, texte souligné/italique, emojis et lien affichés ; taille normale du navigateur restaurée.

## Contrôles techniques finaux

- `npm run check` : lint, typage, 35 fichiers de tests, **192 tests réussis**. Dont 31 tests SQL exécutés (26 événements, 3 limitations, 2 inscriptions).
- `node scripts/qa.mjs build` : compilation réussie, 100 pages générées ; paquet redémarré pour la dernière passe navigateur.
- `verify` : 25 contrôles connectés réussis ; `auth` : 8 ; `web` : 8. Nettoyage de leurs propres objets temporaires confirmé par les scripts.
- `supabase db diff --local --schema public` : toutes les migrations rejouées, **No schema changes found**. La première tentative n’atteignait pas le port de la base temporaire 54320 ; tunnel local temporaire ouvert, contrôle réussi, tunnel fermé. La mention « branch main » du CLI concerne son contexte local, pas une fusion Git ; branche Git vérifiée `codex/audit-parcours-20260907`.
- `npm audit --audit-level=high` : **0 vulnérabilité signalée** à l’exécution finale ; aucune mise à jour automatique des dépendances.
- Lint/advisor SQL : avertissements existants dans l’extension PostGIS et sur sa table de référence `spatial_ref_sys`, pas un échec de la migration applicative. Ils ne sont pas masqués par une modification arbitraire de l’extension.
