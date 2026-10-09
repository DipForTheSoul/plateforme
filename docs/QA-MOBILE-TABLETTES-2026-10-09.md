# Rapport de vérification mobile et tablette — 9 octobre 2026

## Conclusion

La version de production `https://www.forthesoul.ch` a passé la matrice automatisée décrite ci-dessous : **20 scénarios sur 20 réussis**.

Les actions signalées comme bloquées sur tablette ont été exécutées avec une surface tactile simulée :

- ouverture et fermeture du menu mobile ;
- changement de devise vers EUR ;
- changement de langue vers l’allemand ;
- saisie d’une date et prise en compte du filtre dans l’URL ;
- refus des cookies Analytics ;
- acceptation des cookies Analytics ;
- contrôle de l’absence de débordement horizontal ;
- contrôle de l’absence d’erreur JavaScript pendant le parcours.

## Matrice couverte

| Famille | Moteur | Format | Orientation |
|---|---|---|---|
| iPhone SE | WebKit/Safari | petit mobile | portrait |
| iPhone 13 | WebKit/Safari | mobile | portrait |
| iPad mini | WebKit/Safari | tablette | portrait et paysage |
| iPad Pro 11 | WebKit/Safari | grande tablette | portrait et paysage |
| Pixel 7 | Chromium/Chrome | mobile Android | portrait |
| Tablette Android | Chromium/Chrome | tablette | portrait et paysage |
| Tablette générique | Firefox | tablette | portrait |

## Résultats techniques

- Tests tactiles multi-appareils : **20/20 réussis**.
- Tests applicatifs existants : **294/294 réussis**.
- Lint : réussi.
- Vérification TypeScript : réussie.
- Build de production Next.js : réussi.

Commande reproductible :

```bash
npm run test:e2e:devices
npm run check
npm run build
```

Les scénarios sont conservés dans `tests/e2e/mobile-tablet-interactions.spec.ts` et leur matrice dans `playwright.config.ts`. Ils pourront être relancés avant chaque mise en ligne.

## Interprétation du problème signalé sur iPad

Sur la production testée le 9 octobre 2026, les fonctions concernées répondent sur WebKit tactile. Le fait que les liens de catégories aient fonctionné chez Didier alors que toutes les commandes interactives étaient inertes est compatible avec un problème de chargement JavaScript local, de cache, de bloqueur de contenu ou avec une version ancienne d’iPadOS/Safari.

La plateforme utilise Next.js 16, dont la compatibilité navigateur officielle commence à **Safari 16.4**. Une promesse honnête de fonctionnement ne peut donc pas inclure une tablette restée sur Safari antérieur à 16.4. Si le problème se reproduit sur l’appareil de Didier, il faut relever le modèle de l’iPad, la version exacte d’iPadOS et tester après mise à jour/rechargement sans bloqueur de contenu.

## Limite de la preuve

Cette recette couvre les principales tailles, orientations et moteurs modernes, mais aucun laboratoire logiciel ne peut représenter chaque modèle physique, chaque version d’iOS et chaque extension installée. Le résultat permet d’affirmer que le site fonctionne sur les familles modernes couvertes ; il ne permet pas d’affirmer qu’un ancien iPad non mis à jour est compatible.

## Point de sécurité séparé

L’audit des dépendances de production signale encore des avis de sécurité sur la version installée de Next.js et deux dépendances transitives. Cela ne remet pas en cause les résultats tactiles ci-dessus, mais doit être traité dans une mise à jour technique séparée avant de qualifier une prochaine livraison de totalement prête sur le plan sécurité.
