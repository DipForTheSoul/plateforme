import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

/** Paramètres éditables par l'admin (§4.4 taux de change, durées par défaut). */
export default async function AdminSettingsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  const values: Record<string, string> = {};
  for (const row of (data as { key: string; value: string }[]) ?? []) {
    values[row.key] = row.value;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">Paramètres</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          Réglages généraux de la plateforme (taux de change, durées par défaut).
        </p>
      </div>
      <SettingsForm values={values} />
    </div>
  );
}
