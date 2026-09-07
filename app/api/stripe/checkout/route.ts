import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPack, resolvePackPriceChf, getPromo, discountedChf } from "@/lib/credits";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Création d'une session Stripe Checkout pour un pack de publications
 * (Phase 6). Les crédits ne sont JAMAIS ajoutés ici ni au retour navigateur :
 * uniquement via le webhook signé (app/api/stripe/webhook).
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Le paiement en ligne est momentanément indisponible." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  // Langue préférée du praticien → locale Stripe Checkout.
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_lang")
    .eq("id", user.id)
    .maybeSingle();
  const stripeLocale = (profile?.preferred_lang === "de" ? "de" : profile?.preferred_lang === "en" ? "en" : "fr") as "fr" | "de" | "en";
  if (!practitioner) {
    return NextResponse.json({ error: "Aucune fiche praticien." }, { status: 403 });
  }

  let packId: unknown;
  try { const body = await request.json(); packId = body?.packId; }
  catch { return NextResponse.json({error: 'Requête invalide.'}, {status:400}); }
  const pack = typeof packId === 'string' ? getPack(packId) : undefined;
  if (!pack) {
    return NextResponse.json({ error: "Pack inconnu." }, { status: 400 });
  }

  // Prix éditables par l'admin (table `settings`) + éventuelle promo (étiquette + %).
  // Le montant est envoyé à la volée → Didier change tout dans son admin, jamais sur Stripe.
  const { data: settingsRows, error: settingsError } = await supabase.from("settings").select("key, value");
  if (settingsError) return NextResponse.json({error:'Les tarifs sont momentanément indisponibles.'}, {status:503});
  const settings = Object.fromEntries(
    ((settingsRows as { key: string; value: string }[]) ?? []).map((s) => [s.key, s.value])
  );
  const priceChf = resolvePackPriceChf(pack, settings);
  const promo = getPromo(settings);
  const finalChf = promo && promo.percent > 0 ? discountedChf(priceChf, promo.percent) : priceChf;
  const unitAmount = Math.round(finalChf * 100);
  if (!Number.isSafeInteger(unitAmount) || unitAmount < 50 || unitAmount > 99999999) return NextResponse.json({error:'Le montant du pack doit être vérifié par l’administrateur.'}, {status:503});
  const localePrefix = stripeLocale === 'fr' ? '' : `/${stripeLocale}`;
  const productName = promo
    ? `ForTheSoul — ${pack.labelFr} · ${promo.label}`
    : `ForTheSoul — ${pack.labelFr}`;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        locale: stripeLocale,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "chf",
              unit_amount: unitAmount,
              product_data: {
                name: productName,
                description: `${pack.credits} crédit(s) de publication pour ${practitioner.name}`,
              },
            },
            quantity: 1,
          },
        ],
        managed_payments: { enabled: false },
        metadata: {
          practitioner_id: practitioner.id,
          credits: String(pack.credits),
          pack_id: pack.id,
        },
        customer_email: user.email,
        success_url: `${SITE_URL}${localePrefix}/espace-praticien/credits?achat=succes`,
        cancel_url: `${SITE_URL}${localePrefix}/espace-praticien/credits?achat=annule`,
      } as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    if (!session.url) throw new Error('Checkout URL missing');
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[stripe/checkout] Erreur:", msg);
    return NextResponse.json({ error: 'Impossible d’ouvrir le paiement. Réessayez dans quelques instants.' }, { status: 502 });
  }
}
