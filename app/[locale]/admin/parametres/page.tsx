import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole(["admin"]);
  const t = await getTranslations("admin.settings");

  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  const values: Record<string, string> = {};
  for (const row of (data as { key: string; value: string }[]) ?? []) {
    values[row.key] = row.value;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">{t("title")}</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          {t("description")}
        </p>
      </div>
      <SettingsForm values={values} />
    </div>
  );
}
