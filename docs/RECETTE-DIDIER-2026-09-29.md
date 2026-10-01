# Recette des retours de Didier — 29 septembre 2026

Ce document suit les 16 captures du long e-mail de Didier dans leur ordre d'apparition. Il sert de liste de contrôle avant toute publication. Aucun point marqué « à arbitrer » ne doit être présenté comme validé.

## Captures et demandes

| N° | Demande observée | Critère de contrôle local | État |
|---:|---|---|---|
| 1 | Alléger le bandeau de recrutement de l'accueil | Fond clair, contenu lisible, seul le bouton d'action est violet | Fait, à contrôler visuellement |
| 2 | Reprendre les trois bénéfices et le bouton fournis | Les trois phrases et « Découvrir les avantages pour les praticien·nes » sont exacts | Fait, à contrôler visuellement |
| 3 | Corriger la page destinée aux praticien·nes | Surtitre, titre, introduction et trois bénéfices correspondent au texte fourni | Fait, à contrôler visuellement |
| 4 | Enrichir l'inscription praticien | Nom, prénom, nom public, mini-bio, activité, site/Instagram facultatifs, e-mail, mot de passe et confirmation sont présents ; les données alimentent la fiche | Fait, migration locale et tests requis |
| 5 | Afficher les packs dans la devise choisie | Le sélecteur CHF/EUR modifie les montants des packs | Fait, test automatisé existant |
| 6 | Nettoyer et aligner les paramètres de paiement | Aucune instruction Revolut visible ; champs de promotion alignés | Fait, à contrôler visuellement |
| 7 | Corriger le lien du pied de page | Le lien affiche « Créer un compte praticien » | Fait |
| 8 | Corriger le texte d'accueil | Sous-titre « Retraites, ateliers et expériences pour le corps, l'esprit et l'âme » et pastille « Soigneusement validées » | Fait |
| 9 | Rendre « Voir toutes les expériences » plus visible | Une action est présente au-dessus et au-dessous des huit cartes | Fait, à contrôler visuellement |
| 10 | Corriger les mentions légales | Éditeur ForTheSoul.ch / Didier Picamoles / Suisse ; hébergement Vercel et Supabase | Fait |
| 11 | Mettre à jour les CGV avec le texte fourni | Le texte final doit rester conforme aux services réellement vendus sur la plateforme | À arbitrer : le texte fourni cite une mise en avant payante et la publication de lieux, non proposées actuellement |
| 12 | Afficher la durée de validité des packs | La durée réglée dans l'administration est affichée sur chaque pack | Fait en jours ; à arbitrer pour l'affichage demandé en mois |
| 13 | Éviter le défilement horizontal du menu admin | Les boutons reviennent à la ligne et restent accessibles sans défilement horizontal | Fait, à contrôler visuellement |
| 14 | Distinguer les deux types de demandes | Boutons « Contact ForTheSoul » et « Contact praticiens » ; titre « Demande aux praticiens » | Fait |
| 15 | Pouvoir ouvrir une demande adressée à un praticien | Le nom et le message ouvrent une fiche détaillée contenant le message complet | Fait, test automatisé et test de session admin requis |
| 16 | Renommer les messages adressés à la plateforme | Titre « Demande à ForTheSoul » | Fait |

## Décision de conception de Rodrigue — accueil

- Dans le hero de l’accueil, conserver uniquement l’action « Devenir praticien·ne ».
- Ne pas y ajouter une seconde action « Rencontrer les praticien·nes » : l’annuaire reste déjà accessible par l’entrée « Praticiens » de la navigation, notamment dans la barre mobile.
- Expliquer cette recommandation à Didier dans le message récapitulatif final.

## Demandes textuelles hors captures

| Sujet | État |
|---|---|
| Politique de confidentialité : prestataires Vercel, Supabase, Stripe et autres | Détaillé |
| Politique de confidentialité : mise en forme du dernier point de l'article 20 | Corrigé |
| Politique de confidentialité : contact de l'article 24 | Corrigé |
| CGU : exploitant, article 2, contact et version | Corrigé |
| CGU : articles 7, 8, 15 et 16 | À arbitrer : Didier demande de remplacer le texte, sans fournir de rédaction de remplacement |
| Création simplifiée d'un deuxième administrateur | Hors de ce lot, conformément à la décision de Rodrigue |

## Retour du 30 septembre — contacts praticiens dans l'administration mobile

| Demande | Critère de contrôle local | État |
|---|---|---|
| Rendre lisible sur mobile la liste des visiteurs ayant contacté un praticien | Chaque demande apparaît sous forme de fiche verticale, sans tableau ni défilement horizontal ; praticien, contact, téléphone, aperçu du message, newsletter, statut et accès au message complet restent visibles | Corrigé et contrôlé à 321 px de large |

Le tableau à sept colonnes est conservé à partir du format tablette/ordinateur. La vue mobile a aussi été testée avec une adresse e-mail longue et une pastille de statut complète.

## Audit mobile complémentaire du 30 septembre

Contrôle effectué sur les pages publiques principales en français, allemand et anglais, les fiches détaillées, les filtres, le menu mobile, les formulaires réels de création d'expérience et de profil, ainsi que des écrans authentifiés alimentés par des données fictives locales.

| Défaut confirmé | Correction | Preuve locale |
|---|---|---|
| Le réglage numérique de l'administration comprimait « jours » et le bouton d'enregistrement | Champ et suffixe restent sur une ligne ; bouton pleine largeur en dessous sur mobile | Contrôlé à 307 px de large, sans débordement |
| Le menu de l'espace praticien cachait les derniers liens dans un défilement horizontal | Les quatre liens reviennent désormais à la ligne | Les quatre destinations sont visibles à 307 px de large |

Les pages d'accueil, expériences, praticien·nes, lieux, inscription, connexion, contact, favoris, à propos, pages légales et leurs variantes FR/DE/EN ne présentent pas de débordement horizontal au format contrôlé.

## Porte de sortie locale

- [ ] Tous les arbitrages sont tranchés.
- [ ] Migration d'inscription exécutée sur une base locale isolée.
- [ ] Lint, typage, tests et build réussissent.
- [ ] Contrôle visuel desktop et mobile des pages publiques.
- [ ] Contrôle avec session admin des deux rubriques de contact et de l'ouverture d'un message.
- [ ] Contrôle avec session praticien de la devise et de la validité des packs.
- [ ] Aucun changement poussé ou publié avant validation de Rodrigue.

- Page praticien — adaptation responsive du sous-titre : le texte complet fourni est conservé sur ordinateur. Sur mobile, il est raccourci en « Présentez votre univers à un public en quête de sens. » afin de tenir sur une ligne et de rester immédiatement lisible.
