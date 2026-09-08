# Observations de recette — 8 septembre 2026

Transcriptions expurgées des états DOM réellement lus par le pilote CUA dans Chrome. Ce document est un compte rendu, pas un export intégral de trace. Les sorties originales et la capture mobile sont dans la conversation de développement. Paquet `NcIzUhL2hKRGDdtYa0RnL`, URL locale http://localhost:3100. Aucun essai ci-dessous en production.

## Expérience praticien

- Avant envoi : titre « QA chrome reprise 08-09 », description « Texte fictif à conserver après fermeture, erreur et changement de langue. », début `2026-10-09T11:00`, durée `1.5`, hebdomadaire `4`, Français coché, aucun univers. Téléversement du fichier public `public/logo.png` par le bouton + ; le bouton « Retirer cette image » apparaît.
- Envoi sans univers : « Vérifiez les champs indiqués. Votre saisie est conservée. » et « Univers : sélectionnez au moins un univers ». La saisie reste affichée.
- Fermeture de l’onglet puis création d’un autre onglet vers le même formulaire : titre, description, début 11 h, durée 1,5 h, hebdomadaire 4, cases et photo retrouvés.
- Deux onglets : modification du titre en « QA brouillon version A finale » dans A ; B affiche l’alerte de conflit et son bouton d’envoi est désactivé. Rechargement avec confirmation dans B : titre de A retrouvé.
- Passage en allemand : libellés allemands, valeurs et photo conservées.
- Déconnexion A puis connexion autre praticien : titre/description/date vides, aucune photo, événement unique. Retour A : valeurs et photo restaurées.
- Correction avec Yoga & Somatique puis envoi : redirection `?depose=1`, expérience présente dans la liste, solde de 19 à 18. Nouveau formulaire ensuite vide, sans photo ni récurrence.
- Réouverture de `af77a791-19fe-469b-813a-a3ea7480eda6` : titre final, durée 1,5 h, quatre dates 9/16/23/30 octobre à 11 h et photo. Modifier le titre en « QA modification à abandonner », recharger : modification restaurée. Confirmer l’abandon : titre enregistré de retour, quatre dates et photo intactes.

## Profils

- Praticien : biographie remplacée par « QA 08-09 — profil persistant vérifié dans Chrome. ». Rechargement : texte restauré et bouton d’abandon présent. Enregistrement : « Profil mis à jour. », bouton d’abandon absent. Lecture ultérieure en admin : même biographie enregistrée.
- Avant passage en admin, nouveau brouillon privé « QA brouillon privé praticien non envoyé ». Ce brouillon n’apparaît pas dans le profil admin : celui-ci montre le texte enregistré.
- Admin : nouvelle biographie « QA brouillon admin à abandonner », rechargement avec reprise ; abandon confirmé puis texte serveur retrouvé.

## Lieux

- Nouveau : nom « QA lieu brouillon uniquement », adresse « Adresse fictive non envoyée ». Rechargement : deux valeurs conservées. Abandon → Échap : panneau fermé. Abandon → confirmer : nom/adresse vides, pays CH. Aucun clic sur Créer et géocoder.
- Existant `b0000000-0000-4000-8000-000000000001` : nom initial « Salle fictive QA », adresse Place de la Gare 1 à Lausanne. Modification du nom, rechargement avec reprise ; abandon confirmé puis nom/adresse initiaux retrouvés. Aucun clic sur Supprimer ce lieu.

## Expériences admin

- Nouveau : propriétaire Praticien QA et titre « QA brouillon création admin ». Rechargement : propriétaire et titre restaurés. Abandon confirmé : propriétaire Choisir… et titre vide.
- Modification de l’expérience de test : titre « QA édition admin à abandonner » restauré après rechargement, puis titre enregistré « QA brouillon version A finale » retrouvé après abandon confirmé.

## Petit écran et clavier

- Vue mobile demandée 390 × 844 ; largeur DOM effective `innerWidth=433`, `documentElement.scrollWidth=416`. Mesures identiques sur expérience, profil et lieu. Ne pas présenter ceci comme une preuve exacte à 390 CSS px.
- Confirmation expérience/profil : rectangle horizontal gauche ≈33 px, droite ≈384 px ; lieu gauche ≈58 px, droite ≈358 px. Boutons Annuler/Confirmer visibles et activables, pas de débordement global. Capture expérience émise dans la conversation.
- Échap exercé depuis le bouton Annuler sur nouveau lieu : absence de `alertdialog` constatée ensuite. Annuler exercé sur l’expérience avant abandon définitif : texte conservé.
- Taille habituelle du navigateur rétablie à la fin.

## Limites

Voir la section Réserves du rapport et UI-21 à UI-27 du registre. Les tests automatisés complètent les preuves navigateur sans les remplacer. Aucune capture ou assertion de réussite n’est fournie pour les scénarios explicitement non exécutés ou bloqués.
