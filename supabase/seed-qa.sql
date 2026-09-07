-- Local QA only. No real customer addresses, accounts or content.
insert into public.categories (id,name,slug,position) values
('c0000000-0000-4000-8000-000000000001','Danse & Mouvement','danse-mouvement',1),
('c0000000-0000-4000-8000-000000000002','Méditation & Pleine conscience','meditation',2),
('c0000000-0000-4000-8000-000000000003','Yoga & Somatique','yoga-somatique',3),
('c0000000-0000-4000-8000-000000000004','Voyages spirituels','voyages-spirituels',4),
('c0000000-0000-4000-8000-000000000005','Son & Vibration','son-vibration',5)
on conflict(id) do nothing;
insert into public.venues(id,name,address,city,canton,country,lat,lng) values
('b0000000-0000-4000-8000-000000000001','Salle fictive QA','Place de la Gare 1','Lausanne','VD','CH',46.5167,6.629)
on conflict(id) do nothing;
