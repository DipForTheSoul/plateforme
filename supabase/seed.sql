-- ForTheSoul — Données de démonstration (CLAUDE.md §2.3)
-- À exécuter APRÈS les migrations. Idempotent (on conflict do nothing).
-- Les praticiens de seed n'ont pas de user_id : leurs fiches sont gérées par
-- l'admin tant qu'ils n'ont pas créé de compte (rattachement via user_id ensuite).

-- ---------------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug, position) values
  ('c0000000-0000-4000-8000-000000000001', 'Danse & Mouvement',              'danse-mouvement',       1),
  ('c0000000-0000-4000-8000-000000000002', 'Méditation & Pleine conscience', 'meditation',            2),
  ('c0000000-0000-4000-8000-000000000003', 'Yoga & Somatique',               'yoga-somatique',        3),
  ('c0000000-0000-4000-8000-000000000004', 'Voyages spirituels',             'voyages-spirituels',    4),
  ('c0000000-0000-4000-8000-000000000005', 'Son & Vibration',                'son-vibration',         5)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Praticiens (validés)
-- ---------------------------------------------------------------------------
insert into public.practitioners (id, name, slug, bio, specialties, languages, contact, links, status, credits) values
  ('a0000000-0000-4000-8000-000000000001', 'Antara Earth', 'antara-earth',
   'Facilitatrice de danse extatique basée à Berne, Antara crée des espaces de mouvement libre où le corps redevient guide. Ses soirées Love Lounge rassemblent une communauté fidèle autour de voyages musicaux soigneusement tissés.', -- PLACEHOLDER — bio à valider avec la praticienne
   array['Danse extatique', 'Mouvement libre', 'DJing conscient'],
   array['fr', 'de', 'en'],
   '{"email": "contact@antara.example"}'::jsonb,
   '{}'::jsonb, 'approved', 5),

  ('a0000000-0000-4000-8000-000000000002', 'Didier Picamoles', 'didier-picamoles',
   'Fondateur de ForTheSoul et créateur de la Humanic Dance, Didier accompagne depuis Neuchâtel des voyages sonores et dansés qui reconnectent à l''essentiel. Chaque expérience publiée sur la plateforme est validée personnellement par ses soins.', -- PLACEHOLDER — bio à valider avec Didier
   array['Humanic Dance', 'Voyages sonores', 'Facilitation de groupe'],
   array['fr', 'en'],
   '{"email": "welcome@forthesoul.ch"}'::jsonb,
   '{}'::jsonb, 'approved', 10),

  ('a0000000-0000-4000-8000-000000000003', 'Renaud Daniela', 'renaud-daniela',
   'Duo vaudois de breathwork et de sound healing, Renaud et Daniela marient le souffle conscient et les bains sonores pour des expériences profondes de régulation et de présence.', -- PLACEHOLDER — bio à valider
   array['Breathwork', 'Sound healing', 'Bols tibétains'],
   array['fr', 'en'],
   '{"email": "contact@renaud-daniela.example"}'::jsonb,
   '{}'::jsonb, 'approved', 3),

  ('a0000000-0000-4000-8000-000000000004', 'Amber Dubinsky', 'amber-dubinsky',
   'Guide de vision quests et enseignante de yoga, Amber accompagne des immersions en nature en Suisse et à l''international, du silence des Alpes à la jungle du Costa Rica.', -- PLACEHOLDER — bio à valider
   array['Vision quest', 'Yoga', 'Retraites en nature'],
   array['en', 'de'],
   '{"email": "contact@amber.example"}'::jsonb,
   '{}'::jsonb, 'approved', 3),

  -- Fiche EN ATTENTE pour démontrer le flux de validation admin :
  ('a0000000-0000-4000-8000-000000000005', 'Luna Morgenstern', 'luna-morgenstern',
   'Praticienne de yin yoga et de méditation guidée à Zurich.', -- PLACEHOLDER — praticien fictif de démonstration
   array['Yin yoga', 'Méditation'],
   array['de', 'en'],
   '{"email": "luna@example.com"}'::jsonb,
   '{}'::jsonb, 'pending', 0)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Lieux (géocodés — coordonnées réelles des villes)
-- ---------------------------------------------------------------------------
insert into public.venues (id, name, address, lat, lng, canton, country, description, capacity) values
  ('b0000000-0000-4000-8000-000000000001', 'Heitere Fahne', 'Dorfstrasse 22, 3084 Wabern (Berne)', 46.9282, 7.4414, 'BE', 'CH',
   'Lieu culturel et inclusif aux portes de Berne, écrin régulier des soirées de danse consciente.', 120), -- PLACEHOLDER — description à valider
  ('b0000000-0000-4000-8000-000000000002', 'Salle communale de Gampelen', 'Dorfplatz 1, 3236 Gampelen', 47.0157, 7.0533, 'BE', 'CH',
   'Salle lumineuse entre lac et campagne, entre Neuchâtel et Berne.', 80), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000003', 'Espace Danse Neuchâtel', 'Rue des Moulins 15, 2000 Neuchâtel', 46.9900, 6.9293, 'NE', 'CH',
   'Studio au cœur de Neuchâtel dédié au mouvement et aux pratiques somatiques.', 60), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000004', 'Selva Armonia', 'Puerto Viejo de Talamanca, Limón', 9.6558, -82.7546, null, 'CR',
   'Éco-lodge niché dans la jungle caribéenne du Costa Rica, base des immersions SELVA.', 24), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000005', 'Chalet du Silence', 'Route d''Anzère 45, 1972 Anzère (Valais)', 46.3052, 7.3986, 'VS', 'CH',
   'Chalet de montagne face aux Alpes valaisannes, idéal pour les retraites de silence.', 18), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000006', 'Studio Souffle Lausanne', 'Avenue de Morges 33, 1004 Lausanne', 46.5197, 6.6323, 'VD', 'CH',
   'Studio chaleureux dédié au breathwork et aux pratiques respiratoires.', 40), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000007', 'La Grange Sonore', 'Route de la Glâne 8, 1700 Fribourg', 46.8065, 7.1620, 'FR', 'CH',
   'Ancienne grange rénovée en espace de concerts méditatifs et bains sonores.', 50) -- PLACEHOLDER
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Événements (validés, dates à venir)
-- ---------------------------------------------------------------------------
insert into public.events
  (id, title, slug, description, category_id, practitioner_id, venue_id,
   start_date, end_date, duration_minutes, price, languages, status, is_top) values

  ('e0000000-0000-4000-8000-000000000001', 'Love Lounge', 'love-lounge-berne',
   'Soirée de danse extatique au cœur de Berne : un voyage musical sans paroles et sans substances, pieds nus, guidé par Antara. Ouverture en cercle, vague dansée de deux heures, clôture en douceur.', -- PLACEHOLDER — texte à valider
   'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   '2026-09-11 19:30:00+02', '2026-09-11 22:30:00+02', 180, 35.00, array['de', 'en'], 'approved', true),

  ('e0000000-0000-4000-8000-000000000002', 'Gong for Gaïa meets Humanic Dance', 'gong-for-gaia-humanic-dance',
   'Rencontre entre le bain de gongs de Gong for Gaïa et la Humanic Dance de Didier : deux heures de vibration profonde suivies d''une danse libre et incarnée.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   '2026-09-19 18:00:00+02', '2026-09-19 21:30:00+02', 210, 45.00, array['fr', 'de'], 'approved', true),

  ('e0000000-0000-4000-8000-000000000003', 'SELVA – Vision Quest & Jungle Immersion', 'selva-vision-quest-costa-rica',
   'Dix jours d''immersion dans la jungle du Costa Rica : vision quest, cérémonies de mouvement, silence et nature brute. Accompagnement par Didier et une équipe locale.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004',
   '2027-02-05 10:00:00+01', '2027-02-15 16:00:00+01', null, 2400.00, array['fr', 'en'], 'approved', true),

  ('e0000000-0000-4000-8000-000000000004', 'Humanic Dance – Dancing Spirit', 'humanic-dance-dancing-spirit',
   'La Humanic Dance à Neuchâtel : une pratique de danse consciente accessible à toutes et tous, portée par la sélection musicale d''Antara et la facilitation de Didier.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003',
   '2026-10-02 19:00:00+02', '2026-10-02 21:30:00+02', 150, 30.00, array['fr'], 'approved', false),

  ('e0000000-0000-4000-8000-000000000005', 'Retraite Yoga & Silence', 'retraite-yoga-silence-valais',
   'Quatre jours de yoga, de méditation et de silence face aux Alpes valaisannes. Pratiques du matin, marches contemplatives, repas végétariens en pleine conscience.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005',
   '2026-10-22 16:00:00+02', '2026-10-25 14:00:00+02', null, 590.00, array['en', 'de'], 'approved', false),

  ('e0000000-0000-4000-8000-000000000006', 'Souffle & Présence – Breathwork', 'souffle-presence-breathwork-lausanne',
   'Session de breathwork conscient à Lausanne : deux heures de respiration guidée pour libérer les tensions et retrouver un ancrage profond. Accompagnement musical live.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000006',
   '2026-09-24 19:00:00+02', '2026-09-24 21:00:00+02', 120, 40.00, array['fr'], 'approved', false),

  ('e0000000-0000-4000-8000-000000000007', 'Sound Healing & Bols Tibétains', 'sound-healing-bols-tibetains-fribourg',
   'Bain sonore allongé à Fribourg : bols tibétains, gongs et voix pour une heure trente de détente vibratoire profonde. Tapis et couvertures fournis.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007',
   '2026-10-09 19:30:00+02', '2026-10-09 21:00:00+02', 90, 35.00, array['fr'], 'approved', false),

  -- Événement EN ATTENTE pour démontrer la file de validation admin :
  ('e0000000-0000-4000-8000-000000000008', 'Cercle de Méditation du Solstice', 'cercle-meditation-solstice',
   'Méditation guidée du solstice d''hiver, en cercle, à la bougie.', -- PLACEHOLDER — événement fictif de démonstration
   'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000006',
   '2026-12-21 18:30:00+01', '2026-12-21 20:30:00+01', 120, 25.00, array['fr'], 'pending', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Contacts newsletter de démonstration
-- ---------------------------------------------------------------------------
insert into public.contacts (email, first_name, last_name, interests, consent, opt_in_at, source) values
  ('marie.exemple@example.com',  'Marie',  'Exemple', array['danse-mouvement', 'son-vibration'], true, now(), 'seed'),
  ('lucas.exemple@example.com',  'Lucas',  'Exemple', array['meditation'],                       true, now(), 'seed'),
  ('sophie.exemple@example.com', 'Sophie', 'Exemple', array['yoga-somatique', 'voyages-spirituels'], true, now(), 'seed')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- Compte admin : créer l'utilisateur welcome@forthesoul.ch via l'inscription
-- du site (ou le dashboard Supabase), PUIS exécuter :
-- ---------------------------------------------------------------------------
update public.profiles set role = 'admin' where email = 'welcome@forthesoul.ch';

-- Rattacher la fiche praticien de Didier à son compte une fois créé :
update public.practitioners p
set user_id = u.id
from auth.users u
where u.email = 'welcome@forthesoul.ch'
  and p.slug = 'didier-picamoles'
  and p.user_id is null;
