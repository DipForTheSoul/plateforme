# Anomalies traitées pendant le complément brouillons

## BRO-LOCAL-01 — fermeture d’onglet

P1 pour la nouvelle garantie demandée. Le brouillon d’onglet initial ne survivait pas à une nouvelle session. Test rouge puis vert `retrouve le texte après fermeture de la session navigateur`. Correction : stockage persistant opt-in sur les formulaires authentifiés, conservation du stockage de session sur contact. **Retest OK** : Chrome, compte praticien, création avec texte/date/durée/récurrence/photo ; fermeture de l’onglet puis nouveau onglet et reprise exacte. Paquet final `NcIzUhL2hKRGDdtYa0RnL`. Voir UI-01 à UI-03. Arrêt complet du processus navigateur non exécuté.

## BRO-LOCAL-02 — réutilisation React lors d’un changement de compte

P1. Reproduction React : saisir avec le propriétaire A, rendre le même formulaire pour B sans démontage ; le titre de A restait présent. Correction : clé de montage compte + objet pour expériences, profils et lieux. Test de régression rouge puis vert sur le changement de propriétaire. **Retest OK** : connexion A → déconnexion → B sans reprise du titre/photo de A ; retour A avec reprise. Le profil ouvert en admin n’importe pas le brouillon du praticien. UI-06 et UI-12, paquet final.

## BRO-LOCAL-03 — conflit découvert au clic d’envoi

P1. Deux formulaires chargés ; A écrit, B soumet avant réception d’une notification de stockage. Une mise à jour d’état React seule ne bloquait pas l’envoi dans ce même événement. Correction : témoin synchrone et comparaison du stockage avant envoi, bouton désactivé une fois conflit signalé. **Retest automatisé OK** : test rouge puis vert `bloque l’envoi si le conflit n’est découvert qu’au clic de soumission`. Le parcours voisin multi-onglets est aussi **retesté OK dans Chrome** : alerte, envoi désactivé, rechargement confirmé de la version A (UI-04). La course exacte avant notification reste NON TESTÉE dans Chrome ; aucune affirmation de verrou atomique.

## BRO-LOCAL-04 — ancien brouillon et stockage indisponible

P2. La première adaptation lisait l’ancien brouillon de session sans le transférer ; un refus de lecture ne signalait pas immédiatement l’indisponibilité. Deux tests rouges puis verts. Correction : transfert des clés sûres à la lecture et avertissement explicite. Vérification automatisée ; limites de simulation navigateur à noter dans le registre.

Statut : tests automatisés OK ; injection de panne/migration depuis l’ancienne version NON TESTÉE dans le navigateur final. Aucun échec observé sur le parcours normal ; ne pas assimiler ce résultat au retest UI de la panne.

## BRO-LOCAL-05 — confirmation native bloquant le pilotage intégré

P2 pour la recette. En navigateur intégré, cliquer sur l’abandon ouvrait une confirmation native que le pilote n’exposait pas et les interactions suivantes restaient bloquées. Cause exacte navigateur/pilote non établie. La confirmation a été remplacée par un panneau dans la page, nommé et navigable au clavier. **Retest OK dans Chrome** : annuler conserve le brouillon, confirmer le retire et restaure les données serveur ; Échap ferme le panneau. Le pilotage intégré reste BLOQUÉ, sans tentative de contournement de ses restrictions. UI-08 à UI-17 et UI-20.
