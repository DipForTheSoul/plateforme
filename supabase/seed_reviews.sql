-- ForTheSoul — Avis de démonstration. Idempotent (UUID fixes). Le trigger
-- recalcule rating_avg / rating_count sur les événements concernés.

insert into public.reviews (id, event_id, author_name, rating, comment, created_at) values
  -- Love Lounge (e…001)
  ('d0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','Marie L.',5,'Une soirée magique, portée par une énergie folle. Antara crée un espace incroyablement sûr.', now() - interval '20 days'),
  ('d0000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','Thomas B.',5,'Première danse extatique et clairement pas la dernière. On ressort transformé.', now() - interval '12 days'),
  ('d0000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000001','Sarah K.',4,'Très belle expérience, la salle était un peu pleine mais l''ambiance valait le déplacement.', now() - interval '5 days'),
  -- Gong for Gaïa meets Humanic Dance (e…002)
  ('d0000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000002','Élodie R.',5,'Le bain de gongs suivi de la danse : une combinaison bouleversante. Merci Didier.', now() - interval '30 days'),
  ('d0000000-0000-4000-8000-000000000005','e0000000-0000-4000-8000-000000000002','Marc V.',5,'Profondément relaxant puis libérateur. Je recommande à 100%.', now() - interval '18 days'),
  ('d0000000-0000-4000-8000-000000000006','e0000000-0000-4000-8000-000000000002','Nina P.',4,'Superbe voyage sonore. J''aurais aimé que la partie dansée dure un peu plus longtemps.', now() - interval '9 days'),
  -- SELVA Costa Rica (e…003)
  ('d0000000-0000-4000-8000-000000000007','e0000000-0000-4000-8000-000000000003','Julien M.',5,'Dix jours hors du temps. Une immersion qui change une vie.', now() - interval '60 days'),
  ('d0000000-0000-4000-8000-000000000008','e0000000-0000-4000-8000-000000000003','Clara D.',5,'Accompagnement d''une justesse rare, cadre à couper le souffle.', now() - interval '45 days'),
  -- Retraite Yoga & Silence Valais (e…005)
  ('d0000000-0000-4000-8000-000000000009','e0000000-0000-4000-8000-000000000005','Anne-Sophie G.',5,'Le silence face aux Alpes, un cadeau. Repas délicieux, pratiques justes.', now() - interval '25 days'),
  ('d0000000-0000-4000-8000-00000000000a','e0000000-0000-4000-8000-000000000005','Pierre F.',4,'Très ressourçant. Les nuits en montagne étaient fraîches, prévoir de bons vêtements.', now() - interval '14 days'),
  -- Souffle & Présence Breathwork (e…006)
  ('d0000000-0000-4000-8000-00000000000b','e0000000-0000-4000-8000-000000000006','Laetitia S.',5,'Deux heures intenses, beaucoup de libération. Renaud et Daniela sont formidables.', now() - interval '8 days'),
  ('d0000000-0000-4000-8000-00000000000c','e0000000-0000-4000-8000-000000000006','David C.',5,'Le breathwork le plus profond que j''ai fait. Musique live sublime.', now() - interval '3 days'),
  -- Sound Healing Fribourg (e…007)
  ('d0000000-0000-4000-8000-00000000000d','e0000000-0000-4000-8000-000000000007','Manon T.',5,'Bain sonore d''une douceur incroyable. On flotte.', now() - interval '10 days'),
  ('d0000000-0000-4000-8000-00000000000e','e0000000-0000-4000-8000-000000000007','Kevin R.',4,'Très apaisant, parfait après une semaine chargée.', now() - interval '6 days'),
  -- Bagno Sonoro Lugano (e…00b)
  ('d0000000-0000-4000-8000-00000000000f','e0000000-0000-4000-8000-00000000000b','Chiara M.',5,'Esperienza meravigliosa in riva al lago. Elio è un maestro.', now() - interval '7 days'),
  ('d0000000-0000-4000-8000-000000000010','e0000000-0000-4000-8000-00000000000b','Lucas B.',5,'Cadre magnifique, vibrations profondes. Un pur moment de paix.', now() - interval '2 days'),
  -- Humanic Dance Genève (e…00f)
  ('d0000000-0000-4000-8000-000000000011','e0000000-0000-4000-8000-00000000000f','Valentine A.',5,'La Humanic Dance à Genève, un bonheur. Débutante et tout de suite à l''aise.', now() - interval '4 days'),
  ('d0000000-0000-4000-8000-000000000012','e0000000-0000-4000-8000-00000000000f','Hugo N.',4,'Très belle facilitation, sélection musicale au top.', now() - interval '1 days')
on conflict (id) do nothing;
