-- ForTheSoul — Jeu de données étendu (démo plus vivante, villes suisses variées).
-- Idempotent (on conflict do nothing). À exécuter après seed.sql.

-- ---------------------------------------------------------------------------
-- Praticiens supplémentaires
-- ---------------------------------------------------------------------------
insert into public.practitioners (id, name, slug, bio, specialties, languages, contact, links, status, credits) values
  ('a0000000-0000-4000-8000-000000000006', 'Nadia Sereno', 'nadia-sereno',
   'Enseignante de yoga et de méditation à Genève, Nadia propose des pratiques douces mêlant respiration, mouvement lent et silence, pour toutes et tous.', -- PLACEHOLDER — bio à valider
   array['Hatha yoga', 'Méditation guidée', 'Yin yoga'],
   array['fr', 'en'],
   '{"email": "contact@nadia-sereno.example"}'::jsonb,
   '{}'::jsonb, 'approved', 5),

  ('a0000000-0000-4000-8000-000000000007', 'Elio Ventura', 'elio-ventura',
   'Facilitateur tessinois de bains sonores et de breathwork, Elio crée des voyages vibratoires entre lac et montagne, à Lugano et au-delà.', -- PLACEHOLDER — bio à valider
   array['Sound healing', 'Breathwork', 'Cristaux chantants'],
   array['it', 'fr', 'en'],
   '{"email": "contact@elio-ventura.example"}'::jsonb,
   '{}'::jsonb, 'approved', 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Lieux supplémentaires (coordonnées réelles des villes)
-- ---------------------------------------------------------------------------
insert into public.venues (id, name, address, lat, lng, canton, country, description, capacity) values
  ('b0000000-0000-4000-8000-000000000008', 'Studio Rasa Genève', 'Rue de la Coulouvrenière 8, 1204 Genève', 46.2015, 6.1360, 'GE', 'CH',
   'Studio lumineux au bord du Rhône, dédié au yoga et aux pratiques du souffle.', 45), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-000000000009', 'Kraftwerk Zürich', 'Selnaustrasse 25, 8001 Zürich', 47.3717, 8.5323, 'ZH', 'CH',
   'Ancienne centrale électrique reconvertie en espace culturel, parfaite pour la danse consciente.', 200), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-00000000000a', 'Spazio Tao Lugano', 'Via Trevano 55, 6900 Lugano', 46.0140, 8.9620, 'TI', 'CH',
   'Espace de bien-être au cœur du Tessin, entre palmiers et lac, pour sons et respiration.', 40), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-00000000000b', 'Ferme du Soleil', 'Chemin des Vignes 12, 1950 Sion', 46.2270, 7.3590, 'VS', 'CH',
   'Ferme valaisanne rénovée, entourée de vignes, pour retraites et cercles.', 30), -- PLACEHOLDER
  ('b0000000-0000-4000-8000-00000000000c', 'Villa du Lac', 'Avenue de Chillon 3, 1820 Montreux', 46.4330, 6.9160, 'VD', 'CH',
   'Villa face au Léman et aux Alpes, cadre intimiste pour breathwork et méditation.', 25) -- PLACEHOLDER
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Événements supplémentaires (validés, dates à venir, variés)
-- ---------------------------------------------------------------------------
insert into public.events
  (id, title, slug, description, category_id, practitioner_id, venue_id,
   start_date, end_date, recurrence, duration_minutes, price, languages, status, is_top) values

  ('e0000000-0000-4000-8000-000000000009', 'Ecstatic Dance Zürich', 'ecstatic-dance-zurich',
   'Grande soirée de danse extatique à Zürich dans l''ambiance industrielle du Kraftwerk : échauffement en cercle, vague dansée, retour au calme. Pieds nus, sans alcool.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000009',
   '2026-08-29 19:00:00+02', '2026-08-29 22:00:00+02', null, 180, 38.00, array['de', 'en'], 'approved', false),

  ('e0000000-0000-4000-8000-00000000000a', 'Yoga du matin au bord du Rhône', 'yoga-matin-geneve',
   'Séance de hatha yoga douce chaque samedi matin à Genève, ouverte à tous les niveaux. Tapis fournis, thé offert à la fin.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000008',
   '2026-08-22 09:00:00+02', '2026-08-22 10:15:00+02', 'weekly', 75, 22.00, array['fr', 'en'], 'approved', false),

  ('e0000000-0000-4000-8000-00000000000b', 'Bagno Sonoro sul Lago', 'bagno-sonoro-lugano',
   'Bain sonore au bord du lac de Lugano : bols de cristal, gongs et voix pour une heure de détente vibratoire profonde, allongé sous les palmiers.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-00000000000a',
   '2026-09-05 18:30:00+02', '2026-09-05 20:00:00+02', null, 90, 42.00, array['it', 'fr'], 'approved', true),

  ('e0000000-0000-4000-8000-00000000000c', 'Méditation pleine lune', 'meditation-pleine-lune-geneve',
   'Cercle de méditation guidée à la pleine lune, en silence et à la bougie, suivi d''un temps de partage et d''une tisane.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000008',
   '2026-09-07 20:00:00+02', '2026-09-07 21:30:00+02', 'monthly', 90, 20.00, array['fr'], 'approved', false),

  ('e0000000-0000-4000-8000-00000000000d', 'Retraite Souffle & Vignes', 'retraite-souffle-vignes-sion',
   'Week-end de breathwork et de marche consciente dans les vignes valaisannes : deux jours pour ralentir, respirer et se reconnecter à la nature.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-00000000000b',
   '2026-10-17 10:00:00+02', '2026-10-18 17:00:00+02', null, null, 320.00, array['fr', 'en'], 'approved', true),

  ('e0000000-0000-4000-8000-00000000000e', 'Breathwork face au Léman', 'breathwork-leman-montreux',
   'Session de respiration holotropique douce dans une villa face au lac, pour libérer les tensions et retrouver de la clarté. Places limitées.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-00000000000c',
   '2026-10-30 18:30:00+01', '2026-10-30 21:00:00+01', null, 150, 55.00, array['fr'], 'approved', false),

  ('e0000000-0000-4000-8000-00000000000f', 'Humanic Dance – Édition Genève', 'humanic-dance-geneve',
   'La Humanic Dance de Didier s''invite à Genève : danse consciente, sélection musicale immersive et facilitation en cœur. Débutants bienvenus.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000008',
   '2026-11-14 19:00:00+01', '2026-11-14 21:30:00+01', null, 150, 33.00, array['fr', 'en'], 'approved', true),

  ('e0000000-0000-4000-8000-000000000010', 'Concert méditatif de gongs', 'concert-meditatif-gongs-lugano',
   'Voyage sonore d''une heure et demie porté par une dizaine de gongs planétaires. Une immersion vibratoire pour lâcher le mental.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-00000000000a',
   '2026-11-21 20:00:00+01', '2026-11-21 21:30:00+01', null, 90, 45.00, array['it', 'fr'], 'approved', false),

  ('e0000000-0000-4000-8000-000000000011', 'Yin Yoga & Sons de Noël', 'yin-yoga-sons-noel-geneve',
   'Séance de yin yoga profondément relaxante accompagnée de bols chantants, pour clôturer l''année en douceur.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000008',
   '2026-12-19 18:00:00+01', '2026-12-19 19:30:00+01', null, 90, 28.00, array['fr', 'en'], 'approved', false),

  ('e0000000-0000-4000-8000-000000000012', 'Nouvel An en conscience – Retraite', 'nouvel-an-conscience-valais',
   'Trois jours pour passer le cap de l''année en pleine conscience : yoga, méditation, cercles de parole et marche en montagne dans les Alpes valaisannes.', -- PLACEHOLDER
   'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005',
   '2026-12-30 15:00:00+01', '2027-01-01 14:00:00+01', null, null, 680.00, array['en', 'fr'], 'approved', true)
on conflict (id) do nothing;
