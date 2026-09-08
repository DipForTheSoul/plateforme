# Anomalies reproduites et corrections

| Référence | Reproduction | Correction / contrôle |
| --- | --- | --- |
| D08 | Le champ durée reste visible en mode plusieurs jours. | Champ masqué et désactivé, valeur retrouvée en revenant à une journée ; le serveur ignore aussi une ancienne durée si une fin est fournie. Test automatisé rouge puis vert, et navigateur. |
| D09–D10 | Séjour du 17 octobre 10 h au 18 octobre 16 h : heures de fin absentes, durée affichée comme un jour. | Deux dates/heures sur carte et fiche ; deux jours calendaires inclusifs. FR/DE/EN et agenda réel vérifiés. |
| D05 | Après une suppression, la mise à jour contrôlée de la récurrence crée un brouillon artificiel ; une deuxième suppression est bloquée. | La mise à jour confirmée du serveur devient la référence enregistrée. Deux suppressions successives réellement exécutées ; une vraie saisie non sauvegardée reste protégée. |
| EDI-01 | Cliquer Italique sur une sélection déjà en gras retire le gras. | Distinction des marqueurs simple/double ; test de régression ajouté après reproduction navigateur. |
| MOB-01 | Date libre + bouton Supprimer élargissent la grille praticien à 399 px sur un écran de 390 px. | Colonne de grille explicitement réductible, contenu min-width:0, date et bouton empilés sur petit écran. |
| MOB-02 | En-tête de 384 px sur écran de 320 px ; navigation bureau activée trop tôt à 768 px. | Icône de marque seule sous 400 px, menu compact jusqu’au grand écran ; mêmes liens conservés. Retests 320/375/768/1280 sans débordement global ; allemand également à 1280. |
| LIS-01 | Six choix de filtres rapides : seul le dernier subsiste. | Navigation cumulée avant réponse serveur ; test automatisé rouge/vert puis six choix réels conservés. Canton, retrait de puce et remise à zéro vérifiés. |
| LIS-02 | Liste/Carte puis date rapidement : le changement de vue est annulé. | État de navigation en attente commun aux filtres et au sélecteur de vue. Test de régression et scénario réel Carte + 17/10 puis Liste + 18/10 réussis sur le paquet final. |

Les messages de validation volontairement provoqués (URL dangereuse, univers absent, SVG refusé, serveur arrêté) ne sont pas des anomalies : les saisies restent présentes. Le test automatisé de double suppression attend explicitement la fin de l’état « en cours » avant le deuxième clic ; cliquer un bouton encore désactivé ne doit pas déclencher une seconde action.
