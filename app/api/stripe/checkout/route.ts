import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPack } from "@/lib/credits";
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
      { error: "Stripe non configuré (Rodrigue : clés de test dans .env.local)." },
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
  if (!practitioner) {
    return NextResponse.json({ error: "Aucune fiche praticien." }, { status: 403 });
  }

  const { packId } = (await request.json()) as { packId?: string };
  const pack = packId ? getPack(packId) : undefined;
  if (!pack) {
    return NextResponse.json({ error: "Pack inconnu." }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "chf",
          unit_amount: pack.amountCents,
          product_data: {
            name: `ForTheSoul — ${pack.labelFr}`,
            description: `${pack.credits} crédit(s) de publication pour ${practitioner.name}`,
          },
        },
        quantity: 1,
      },
    ],
    // La metadata est la source de vérité du webhook.
    metadata: {
      practitioner_id: practitioner.id,
      credits: String(pack.credits),
      pack_id: pack.id,
    },
    customer_email: user.email,
    success_url: `${SITE_URL}/espace-praticien/credits?achat=succes`,
    cancel_url: `${SITE_URL}/espace-praticien/credits?achat=annule`,
  });

  return NextResponse.json({ url: session.url });
}
