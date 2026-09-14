# Guide de prise en main — ForTheSoul

Ce guide présente les opérations courantes de la plateforme. Elles peuvent être
réalisées sur ordinateur ou sur téléphone depuis `https://forthesoul.ch`.

## 1. Se connecter

1. Ouvrir le menu du site, puis choisir **Connexion**.
2. Saisir l’adresse e-mail administrateur et le mot de passe associé.
3. Après connexion, ouvrir **Administration**.

Le tableau de bord affiche les éléments qui attendent une intervention :
expériences, fiches praticien, crédits, contacts et statistiques internes.

> Les mots de passe ne doivent jamais être envoyés par e-mail ni ajoutés à ce
> guide. Utiliser « Mot de passe oublié » si nécessaire.

## 2. Valider une fiche praticien

Dans **Administration → Praticien·nes**, les nouvelles inscriptions apparaissent
dans la section **À valider**.

- **Valider la fiche** rend la fiche publique et autorise le praticien à déposer
  des expériences.
- **Refuser (avec motif)** conserve la fiche hors ligne et envoie le motif au
  praticien.
- **Modifier la fiche** permet de corriger les informations avant la décision.

Pour quitter un formulaire de modification, utiliser le bouton **Retour** du
formulaire ou la navigation Administration. Les modifications non envoyées sont
conservées localement pendant sept jours sur l’appareil utilisé.

## 3. Valider ou refuser une expérience

Dans **Administration → Soumissions**, chaque carte affiche le titre, le
praticien, la date ou la période, la catégorie, le lieu et la description.

- **Valider & publier** met l’expérience en ligne et envoie un e-mail au
  praticien.
- **Refuser** laisse l’expérience hors ligne et envoie le message saisi au
  praticien.
- **Modifier** ouvre tous les champs de l’expérience avant la décision.

Toujours vérifier avant validation : titre, texte, langue, prix, date de début,
date de fin, lieu, coordonnées et liens externes.

### Expériences récurrentes

Une série est signalée par la pastille **Récurrent · X dates**. Dans
l’administration, toutes les dates de la série sont visibles. Une date précise
peut être supprimée depuis le formulaire de modification sans effacer toute la
série.

Sur l’accueil, une seule carte représente la série et montre sa prochaine date.
Dans le catalogue complet, les dates restent consultables, et la fiche regroupe
les autres dates disponibles.

## 4. Prix affichés

Le prix saisi en francs suisses est le prix de référence. Le montant en euros est
une conversion indicative selon le taux défini dans **Administration →
Paramètres** ; aucun paiement n’est réalisé en euros.

- **Gratuit** : le praticien a explicitement choisi une expérience gratuite.
- **Prix libre** : le praticien a explicitement choisi une participation libre.
- **Prix non renseigné** : aucun prix ni mode de prix n’a été indiqué.

## 5. Gérer les lieux

Dans **Administration → Lieux**, il est possible d’ajouter, modifier, publier ou
retirer un lieu de l’annuaire.

1. Saisir le nom et l’adresse complète.
2. Vérifier la ville, le canton et le pays.
3. Vérifier le point sur la carte.
4. Choisir si le lieu doit aussi être publié dans l’annuaire indépendant.

Un lieu peut rester utilisable par une expérience sans être publié dans
l’annuaire public des lieux.

## 6. Crédits et packs de publications

Les praticiens utilisent un crédit pour publier une expérience et peuvent
acheter un pack depuis leur espace.

Dans **Administration → Crédits** :

- les prix des packs sont modifiables dans les paramètres ;
- un paiement par virement peut être enregistré par une attribution manuelle ;
- une erreur d’attribution peut être corrigée avec une déduction ;
- l’historique détaille achats, attributions et consommations.

Renseigner une note claire pour toute correction manuelle, par exemple
« Virement reçu le 14.09.2026 ».

## 7. Mise en avant

La mise en avant actuelle est décidée et activée uniquement dans
**Administration → Mises en avant**. Sa durée par défaut est configurable dans
cette même section.

La mise en avant payante côté praticien ne fait pas partie du fonctionnement
actuel. Le parcours d’achat avait été retiré lorsque la décision avait été prise
de réserver la mise en avant à l’administration. Si cette orientation change,
il s’agit du prochain développement à cadrer : prix, durée, paiement,
activation automatique ou validation préalable par l’administrateur.

## 8. Contacts Wix et newsletter

Dans **Administration → Newsletter**, la plateforme regroupe les inscriptions à
la newsletter et les contacts importés.

### Origine des 31 contacts constatés le 14 septembre 2026

- 25 contacts proviennent de l’import Wix du 2 septembre 2026 ;
- 6 contacts proviennent des formulaires du site entre le 7 août et le
  1er septembre 2026 ;
- les 31 contacts avaient déjà été marqués comme exportés.

Ce nombre correspond donc à la base existante ; il n’a pas été créé
automatiquement par MailerLite.

### Importer le fichier Wix

1. Dans Wix, exporter les contacts au format **CSV**.
2. Dans **Administration → Newsletter → Import de contacts (Wix)**, sélectionner
   directement ce fichier.
3. Cliquer sur **Importer**.

Les colonnes principales Wix (adresse e-mail, prénom, nom et étiquettes) sont
reconnues automatiquement. Les doublons sont ignorés et aucun contact existant
n’est supprimé. Il reste possible de coller manuellement des lignes au format :

```text
email, prénom, nom, tag1|tag2
```

Importer uniquement des personnes ayant accepté de recevoir la newsletter et
conserver la preuve de consentement issue de Wix.

### Exporter ou synchroniser avec MailerLite

- **Exporter les nouveaux** télécharge uniquement les contacts jamais exportés.
- **Tout réexporter** produit un fichier complet.
- **Synchroniser vers MailerLite** envoie les contacts consentants si la clé API
  et le groupe MailerLite ont été configurés.

MailerLite dédoublonne les abonnés par adresse e-mail. La base ForTheSoul reste
la copie locale de référence et n’est pas supprimée lors d’une synchronisation.

## 9. Statistiques

Le tableau de bord contient une mesure interne des pages consultées sur les
30 derniers jours. Elle fonctionne sans cookie publicitaire.

Google Analytics est un outil distinct : il n’est pas nécessaire pour consulter
les statistiques internes. Son activation éventuelle doit être décidée avec le
paramétrage du consentement et de la confidentialité correspondant.

## 10. Contrôle rapide après une modification

Après une validation ou une modification importante :

1. ouvrir la page publique dans une fenêtre privée ;
2. vérifier la version française, anglaise et allemande ;
3. vérifier l’affichage sur téléphone ;
4. tester les boutons et liens concernés ;
5. revenir dans l’administration pour confirmer le statut enregistré.

En cas d’erreur, ne pas répéter rapidement une action de paiement ou
d’attribution de crédits. Recharger d’abord la page et vérifier l’historique.
