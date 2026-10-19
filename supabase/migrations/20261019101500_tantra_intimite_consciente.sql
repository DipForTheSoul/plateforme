-- Additive category; local preview only until publication is authorized.
insert into public.categories (name, slug, position)
values ('Tantra & Intimité consciente', 'tantra-intimite-consciente', 8)
on conflict (slug) do nothing;
