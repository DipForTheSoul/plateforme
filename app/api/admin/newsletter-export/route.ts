import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/types/database";

/**
 * Export CSV segmenté de la base newsletter (Phase 7), au format d'import
 * MailerLite (colonnes : email, name, last_name, groups).
 * ?interest=<tag> pour exporter un segment ; sans paramètre : tout.
 * Accès : admin uniquement (profil vérifié + RLS).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const interest = request.nextUrl.searchParams.get("interest");
  let query = supabase.from("contacts").select("*").eq("consent", true);
  if (interest) query = query.contains("interests", [interest]);
  const { data } = await query;
  const contacts = (data as Contact[]) ?? [];

  const escape = (value: string | null) =>
    `"${(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    "email,name,last_name,groups",
    ...contacts.map((c) =>
      [
        escape(c.email),
        escape(c.first_name),
        escape(c.last_name),
        escape(c.interests.join(";")),
      ].join(",")
    ),
  ];

  const filename = `forthesoul-newsletter${interest ? `-${interest}` : ""}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
