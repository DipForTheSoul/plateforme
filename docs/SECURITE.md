# Audit sécurité & RLS (Phase 10)

> À exécuter une fois le projet Supabase branché, puis avant chaque mise en
> production. Objectif : vérifier que la clé anon n'expose RIEN de sensible.

## 1. Tests RLS avec la clé anon (curl)

Remplacer `$URL` et `$ANON` par les valeurs de `.env.local`.

```bash
# ✅ DOIT réussir : événements approuvés (catalogue public)
curl "$URL/rest/v1/events?status=eq.approved&select=title" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# ❌ DOIT renvoyer [] : événements en attente (invisibles au public)
curl "$URL/rest/v1/events?status=eq.pending&select=title" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# ❌ DOIT renvoyer [] : profils, contacts, transactions, favoris, page_views
curl "$URL/rest/v1/profiles?select=*"            -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl "$URL/rest/v1/contacts?select=*"            -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl "$URL/rest/v1/credit_transactions?select=*" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl "$URL/rest/v1/favorites?select=*"           -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl "$URL/rest/v1/page_views?select=*"          -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# ❌ DOIT échouer (401/403 ou 0 ligne modifiée) : écriture sauvage
curl -X PATCH "$URL/rest/v1/events?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"status": "approved"}'
```

## 2. Tests avec un compte praticien

Connecté en praticien (récupérer le JWT depuis le navigateur) :
- ❌ `update practitioners set credits = 999` → doit lever
  « Crédits modifiables uniquement via achat ou administrateur ».
- ❌ `update events set status = 'approved'` → doit lever
  « Validation réservée à l'administrateur ».
- ❌ `update profiles set role = 'admin'` → doit lever
  « Seul un administrateur peut modifier un rôle ».
- ❌ lire les événements `pending` d'un AUTRE praticien → 0 ligne.

## 3. Stripe

- Rejouer un webhook déjà traité (Stripe Dashboard → Resend) : le solde ne doit
  PAS augmenter une deuxième fois (idempotence par `stripe_session_id`).
- Envoyer un POST sans signature sur `/api/stripe/webhook` → 400.

## 4. Advisors Supabase

Dashboard → Advisors → Security : traiter tout avertissement (RLS manquante,
fonctions sans `search_path`, etc.).

## 5. Anti-spam

- Formulaires publics (newsletter, inscription) : champ pot-de-miel + rate-limit
  (5 req/min/IP). Tester en soumettant > 5 fois : l'inscription doit échouer.
