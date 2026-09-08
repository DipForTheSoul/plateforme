# Analyse des demandes Didier — avant développement

> Mise à jour après arbitrage : Victor confirme que les six pages sont le lot complet à traiter ; les autres concernent d’anciennes demandes. Il autorise les corrections et les ajouts proposés (éditeur de description et lien externe dédié), avec titre conservé en texte simple. Le cadrage historique ci-dessous n’est donc plus une demande d’autorisation. Développement et recette : [rapport final](recette/2026-09-08-demandes-client/RAPPORT.md).

Date : 8 septembre 2026. Version locale examinée : `9460277`, branche `codex/audit-parcours-20260907`. Analyse documentaire et lecture du code uniquement : aucun correctif applicatif, migration, publication ni nouveau test navigateur exécuté pendant ce cadrage.

## Sources et limites

- `forthesoul mail.pdf` : six pages reçues, toutes lues et toutes les captures examinées visuellement. Le pied de page porte 1/27 à 6/27 : le fichier fourni semble être un extrait. Les éventuelles pages 7 à 27 ne sont pas disponibles dans ce PDF. Ne pas affirmer avoir traité toute la chaîne d’emails.
- `ForTheSoul-Cahier-des-charges-Premium (1).pdf` : dix pages, toutes lues et inspectées. Version juillet 2026 / v1.
- Les emails décrivent les attentes du client ; ils ne constituent pas une autorisation automatique d’étendre le développement. La phrase de Rodrigue indiquant que certains éléments sont hors périmètre et le désaccord de Didier sont des positions à comparer au document, pas des conclusions imposées.
- Classification fonctionnelle fondée sur ces documents, pas une décision juridique ou commerciale. L’absence d’une mention précise n’est pas à elle seule une exclusion explicite.

## Registre complet des demandes visibles

| ID | Source email | Demande / détail de capture | Lecture du périmètre | État dans la version locale et contrôle attendu |
| --- | --- | --- | --- | --- |
| D01 | p.1 | Cartes toujours plus larges que l’écran sur iPhone 17, malgré une carte par ligne. | Correction responsive prévue au §7, p.7 ; cartes au §6.1, p.3. | Des corrections mobiles ont déjà été apportées. Pas de preuve iPhone 17 physique. Rejouer avec contenu long, images, filtres et zoom ; vérifier largeur réelle et absence de défilement horizontal global, pas seulement le nombre de colonnes. |
| D02 | p.1 et p.6 | Heure 11 h / 11 h 11 transformée en 12 h ; le dernier email indique que cela semble corrigé. | Correction du dépôt/dates (§5 p.3, §6.2 p.5). | Conversions Europe/Zurich et tests déjà présents. Retester saisie manuelle et sélecteur, enregistrement/réouverture, FR/DE/EN et chaque occurrence. La capture p.5 montre aussi des heures différentes entre tête et répétitions. |
| D03 | p.1 | Saisie de la durée en heures, confirmée OK par Didier. | Ergonomie de la durée déjà prévue (§5 et §6.2). | Saisie en heures déjà présente avec conversion vers minutes. Retester 1,5 h, erreur de validation et reprise sans changement de valeur. |
| D04 | p.5–6 | Voir les quatre dates de la série en modification admin, pas seulement la mention récurrent 4× en liste. | Gestion des événements récurrents (§3 p.2, §6.2 p.5, §6.5 p.6). | Liste de la date racine et des occurrences présente. Retester liste/détail et cohérence du nombre de dates après modifications. |
| D05 | p.1–2 et p.6 | Le bouton supprimer une date existe mais le clic ne fonctionne pas. | Correction d’une action livrée ; gestion au §6.5 et anomalies au §14 p.9. | Action dédiée présente et précédemment exercée en recette. Une saisie non sauvegardée bloque volontairement la suppression avec un message. Rejouer sans brouillon puis avec brouillon, vérifier message utile, suppression réelle d’une seule date et autres dates intactes. Ne pas supposer que la cause du client est identique sans reproduction. |
| D06 | p.1 | Bouton **Créer le lieu** violet dans le panneau d’ajout de lieu du formulaire expérience. | Ajustement visuel mineur cohérent avec §7 ; couleur exacte non spécifiée. À traiter comme finition, pas nouveau module. | Le bouton ciblé est encore `btn-secondary` dans EventForm. Ne pas confondre avec le lien qui ouvre le panneau. Vérifier aussi focus, chargement et état désactivé. |
| D07 | p.2–3 | Texte d’aide trop peu visible et mal placé ; flèche rouge vers le bloc Récurrence. | Ajustement de lisibilité et ergonomie (§7). | Aide toujours petite et à côté du début. La séparer si nécessaire : conseil de durée près de la durée ; conseil de répétition lisible dans le bloc Récurrence. Appliquer FR/DE/EN. |
| D08 | p.2–3 | Masquer Durée (heures) quand Sur plusieurs jours est sélectionné. | Ajustement du formulaire existant, sans nouvelle fonction métier. | Champ encore affiché dans les deux modes. Conserver les valeurs utiles lors des allers-retours et empêcher qu’une ancienne durée horaire contredise un séjour après sauvegarde. Tester aussi brouillon et édition. |
| D09 | p.3 | Afficher date ET heure de début et date ET heure de fin, éviter un seul jour pour un séjour. | Dates début/fin déjà prévues (§5), affichage catalogue/détail (§6.1). | Les champs multi-jours existent mais sont libellés Arrivée/Départ. La fiche publique masque explicitement les heures d’un séjour ; les cartes ne montrent que le début. Prévoir affichage compréhensible sur fiche et cartes, et libellés explicites du formulaire, sans cacher la fin. |
| D10 | p.3 | Du 17/10/2026 à 10 h au 18/10/2026 à 16 h affiché Durée : 1 jours ; Didier attend deux jours. | Correction de cohérence des dates/durée. | Défaut présent : `eventCalendarDaySpan` calcule l’écart calendaire et la fiche l’affiche comme nombre de jours. Afficher le nombre de jours calendaires inclusifs dans la fiche sans changer aveuglément une fonction d’écart utilisée ailleurs. Distinguer deux jours calendaires de 30 heures écoulées. Tester singulier/pluriel, fin de mois et changement d’heure. |
| D11 | p.1 et p.4 | Barre de mise en forme dans la description : texte mentionne gras/liens ; capture met en évidence gras, italique, souligné, lien et emoji. | Un champ description est prévu (§6.2) ; les commandes de mise en forme ne sont pas explicitement spécifiées. Complément de périmètre à arbitrer, pas simplement un bouton cassé. | Déjà développé : gras, listes, liens et aperçu, avec syntaxe légère ; ce n’est pas un éditeur visuel complet. Manquent italique, souligné et sélecteur d’emojis. Les emojis saisis comme caractères sont une autre chose qu’un sélecteur. Les couleurs sont visibles mais non clairement demandées ; ne pas copier toute l’interface Gmail par défaut. |
| D12 | p.4 | La demande de barre d’outils porte aussi sur le **titre**, pas seulement la description. | Titre enrichi non explicitement prévu, à arbitrer séparément. | Titre texte simple. Un titre enrichi implique cartes, recherche, SEO, partage et exports : conserver une représentation texte exploitable. Recommandation : garder le titre simple, mais obtenir l’accord sur cet écart à la demande plutôt que l’omettre. |
| D13 | p.4 | Et/ou champ séparé au-dessus/dessous du lien vidéo, vers document ou formulaire d’inscription externe. | Aucun champ externe d’événement prévu explicitement dans §5/§6.2. Ajout à arbitrer. Un lien externe n’est pas un moteur de réservation/paiement intégré (phase future §12). | Les liens dans la description existent ; pas de champ événement séparé correspondant. Un champ dédié doit être sauvegardé, validé HTTP(S), restauré dans les brouillons, affiché publiquement et copié dans les récurrences. Ne pas transformer Réserver en un autre parcours sans décision explicite. |

## Ce qui ne doit pas être déduit des captures

- Les icônes barrées dans la capture d’éditeur ne sont pas des demandes d’upload de pièce jointe, Google Drive ou autre intégration.
- La catégorie supplémentaire visible dans un formulaire allemand constitue une donnée d’exemple, pas une demande d’ajout de catégorie dans cet email.
- Les dates affichées en français dans la capture d’interface allemande révèlent un cas de localisation à retester, déjà traité dans la branche, pas une preuve de correction déployée.
- Les retours positifs sur heure et durée ne dispensent pas des tests de non-régression.

## Arbitrage demandé avant de lancer le lot

1. D01–D10 : corrections et finitions des fonctions existantes. Ne pas présenter les anomalies responsive, dates ou suppression comme de nouveaux modules facturables.
2. D11–D13 : absence de spécification explicite. Recommandation produit : compléter raisonnablement l’éditeur de description et ajouter le champ de lien externe, si Victor souhaite les inclure ; conserver le titre simple sauf accord contraire. Aucun engagement de gratuité ou de facturation n’est pris par ce document.
3. Obtenir la suite du PDF d’emails si les 21 autres pages font partie des demandes à couvrir.

## Plan de recette après arbitrage et développement

- Utiliser la branche d’audit et le Supabase local fictif, pas le Supabase connecté d’un autre projet. Aucun envoi aux clients ni paiement réel.
- Décliner D01–D13 en scénarios séparés, avec statut développé / testé / bloqué et preuves. Une fonction déjà présente dans le code n’est pas marquée testée à ce stade.
- Recréer un séjour fictif 17 octobre 10 h → 18 octobre 16 h ; vérifier formulaire, liste, carte, fiche, calendrier et export agenda. Vérifier absence de durée horaire contradictoire et cohérence FR/DE/EN.
- Créer une série fictive de quatre dates ; tester suppression d’une occurrence intermédiaire puis première date, depuis admin et praticien selon droits ; vérifier les autres publications et le crédit.
- Tester le panneau Nouveau lieu et les changements de langue sans perte du formulaire principal.
- Pour tout ajout éditorial autorisé : édition/sélection/aperçu, sauvegarde, contenu public, URL invalides, récurrence, brouillons et impossibilité d’exécuter du HTML ou une URL dangereuse.
- Recette réelle dans le navigateur disponible du Mac, à plusieurs largeurs mesurées, avec données longues et boutons visibles. Safari/iPhone physique ne doit pas être déclaré validé à partir de Chrome redimensionné.
- Construire le paquet final et retester les scénarios corrigés. Pas de push sur main ou de bascule client dans le seul cadre de cette analyse.
