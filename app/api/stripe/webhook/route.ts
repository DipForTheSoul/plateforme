import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * Webhook Stripe (Phase 6) — RÈGLE D'OR n°2 :
 *   · signature VÉRIFIÉE (constructEvent + STRIPE_WEBHOOK_SECRET) ;
 *   · crédits ajoutés UNIQUEMENT ici, via la fonction SQL add_credits dont
 *     l'unicité de stripe_session_id garantit l'idempotence (une session
 *     rejouée n'est jamais comptée deux fois).
 *
 * Rodrigue — test local :
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 * puis un paiement test (4242 4242 4242 4242).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("PLACEHOLDER")) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature absente." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Sécurité : ne créditer que les sessions réellement payées.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const practitionerId = session.metadata?.practitioner_id;
    const credits = Number.parseInt(session.metadata?.credits ?? "0", 10);
    if (!practitionerId || !Number.isInteger(credits) || credits <= 0) {
      console.error("[stripe] metadata invalide sur la session", session.id);
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();
    const { data: added, error } = await admin.rpc("add_credits", {
      p_practitioner_id: practitionerId,
      p_amount: credits,
      p_stripe_session_id: session.id,
    });

    if (error) {
      console.error("[stripe] add_credits a échoué:", error.message);
      // 500 → Stripe retentera (add_credits reste idempotente).
      return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
    if (added === false) {
      console.info("[stripe] session déjà traitée (idempotence):", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
