# Application des Points MD — 15 octobre 2026

Périmètre : correction locale des trois retours Didier (carte, réinitialisation, sélection des filtres). Responsable : Codex/Astra ; revue par l'agent principal. Base d53cfd1, contenu initial identique à main fe29b7ba91bdadb0a69bb994f1e1a20446378836, selon vérification de l'agent principal. Aucune publication autorisée.

| Document lu (version : copie locale au 15/10/2026) | Exigences applicables | État et preuve | Prochain contrôle |
|---|---|---|---|
| README de Points MD - plateformes clients | Applicabilité, preuve, pas de généralisation | Prouvé : présent suivi + rapport daté | À chaque reprise |
| CODEX_GARDE_FOUS_SECURITE_QUALITE_PLATEFORME.md, §1/2/7/11/16/19 | Préserver données, isoler travail, améliorer progressivement, vérifier code et navigateurs | Worktree isolé ; API locale synthétique en lecture seule ; aucune clé réelle ; `npm run check`, build et matrice décrits dans rapport | Revue du diff puis preview seulement sur autorisation |
| RECETTE-MOBILE-TABLETTE.md | Reproduire, tester vrai moteur navigateur tactile, orientations et erreurs JS, distinguer émulation/appareils physiques | Playwright WebKit/Chromium/Firefox ; vrais moteurs, surfaces émulées ; preuves dans `output/catalogue-20261015` | Vérification sur la tablette exacte de Didier et URL publiée après autorisation |
| Référentiel qualité du skill wf-platform-quality | Tests par risque, contrôles visibles et états d'échec | Tests SSR sans JS, chunks bloqués, hydratation retardée, tuiles indisponibles, navigation lente et rapide, rotation et popup | Ne pas annoncer production corrigée sans smoke test livré |

Non applicable à cette tranche : modification auth, paiement, migration/RLS, e-mails, quotas Supabase, publication. Leurs contrôles ne sont pas certifiés par ces tests et aucun de ces modules n'a été changé. Aucun déploiement, audit global de sécurité ou test appareil physique n'a été effectué. Les fichiers utilisateur préexistants et `docs/RETOUR-DIDIER-2026-10-13.md` sont préservés.

Sources locales : `/Users/rodrigue/Desktop/Document Dev./Points MD - plateformes clients/README.md`, sous-dossiers `Sécurité et garde-fous` et `Qualité et livraison`. Skills lus : `wf-platform-dev-loop/SKILL.md`, sa référence `integration-reliability.md`, `wf-platform-quality/SKILL.md` et `references/quality-baseline.md` sous le plugin personnel Wix Factory 1.0.0.
