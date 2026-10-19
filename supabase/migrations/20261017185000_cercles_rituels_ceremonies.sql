-- Additive reference data. Prepared and tested locally; remote application requires review.
-- Existing categories and associations are preserved, including a matching existing slug.
insert into public.categories (name, slug, position)
values ('Cercles, rituels & cérémonies', 'cercles-rituels-ceremonies', 7)
on conflict (slug) do nothing;
