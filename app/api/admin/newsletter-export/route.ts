import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/types/database";
import {csvCell} from '@/lib/contact-csv';

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
  // scope=new : uniquement les contacts jamais exportés (évite les doublons à
  // chaque téléchargement) ; ils sont marqués « exportés » après génération.
  const onlyNew = request.nextUrl.searchParams.get("scope") === "new";

  const contacts:Contact[]=[];
  for(let offset=0;;offset+=500){
    let query = supabase.from("contacts").select("*").eq("consent", true).order('id').range(offset,offset+499);
    if (interest) query = query.contains("interests", [interest]);
    if (onlyNew) query = query.is("exported_at", null);
    const {data,error}=await query;
    if(error)return NextResponse.json({error:'Export momentanément impossible. Aucun fichier incomplet ne sera téléchargé.'},{status:503});
    contacts.push(...((data as Contact[])??[]));
    if(!data||data.length<500)break;
  }

  // Marquer ces contacts comme exportés (mode « nouveaux »).
  if (onlyNew && contacts.length > 0) {
    const {error} = await supabase
      .from("contacts")
      .update({ exported_at: new Date().toISOString() })
      .in(
        "id",
        contacts.map((c) => c.id)
      );
    if(error)return NextResponse.json({error:'Le suivi des exports est indisponible. Réessayez ou utilisez l’export complet.'},{status:503});
  }

  const escape = csvCell;
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

  const filename = `forthesoul-newsletter${interest ? `-${interest.replace(/[^a-z0-9_-]/gi,'-').slice(0,80)}` : ""}${onlyNew ? "-nouveaux" : ""}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
