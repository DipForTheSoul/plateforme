# Compteur de fiches — production 26 octobre 2026

Autorisation Rodrigue : appliquer le correctif serveur + permissions, conserver les historiques et autres corrections. Base main 858e314, caller publié 9ffd007d4f35e12a47a21122009a2e43574f6940 ; Vercel 5WoRyBfBZZN7CU9zqdhFLjGfaFK3 Ready / Production / www.forthesoul.ch.

Supabase : forthesoul / pccbiclpgrjmejpybcki / main Production. Définition initiale md5 17a3dcf0bdd4f284cacba13ae6be04eb, propriétaire postgres, ACL initiale {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}. Corps SQL et données non modifiés.

Séquence appliquée : caller server-only avec timeout 1500 ms, exclusion agents identifiés/préchargements/previews ; contrôle du déploiement et incrément navigateur 44 → 45 ; puis REVOKE EXECUTE FROM PUBLIC, anon, authenticated dans une transaction avec garde d'empreinte/propriétaire/permission serveur. Script exact dans supabase/migrations/20261026100744_restrict_event_view_counter.sql, exécuté manuellement en console. Historique de migration Supabase non marqué par cette exécution manuelle ; script idempotent sur l'état actuel.

Après application : has_function_privilege anon=false, authenticated=false, service_role=true. Appel REST anonyme réel sur UUID inexistant → 401, 42501 permission denied. Rechargement de la fiche publiée 134255f8-f73c-4497-b6de-3930f9ca7c05 → compteur 45 → 46 ; titre et contenu accessibles. Sondes Googlebot et purpose=prefetch → HTTP 200 ; compteur relu inchangé à 46. Deux consultations de recette normales ont été comptées ; aucun historique remis à zéro.

Tests locaux : 40 PASS (event-view-counter + traffic-policy), eslint fichiers modifiés PASS, typecheck PASS. Tests de panne RPC/rejet/configuration absente + reprise sans erreur de rendu, warnings sans détails sensibles. Déploiement Vercel build réussi. Pas de paiement, email ou autre données client modifiés.

Limites : filtrage User-Agent contournable, compteur de consultations et non personnes uniques ; pas de garantie zéro robot ou zéro surcoût. Pas de test HTTP avec JWT utilisateur réel ; permission authenticated vérifiée dans PostgreSQL. Ce lot ne clôt pas les autres défauts du précédent audit de sécurité. Preview Lieux conservée sur sa branche, non remplacée par main.

Retour arrière : maintenir le caller serveur ; si un rollback applicatif antérieur à 9ffd007 est indispensable, coordonner les droits du compteur avant ce rollback. Ancienne ACL documentée ci-dessus ; rétablir les droits publics rouvrirait l'exposition, donc ne pas le faire automatiquement. Le compteur secondaire en échec ne bloque pas la fiche.

Preuves locales dossier principal output : counter-permissions-20261026.png, counter-normal-view-20261026.png. Le contrôle SQL final a nécessité de remplacer entièrement l'éditeur Monaco après une erreur de saisie (requête de lecture mal concaténée, rejetée avant exécution) ; aucune mutation issue de cette erreur.
