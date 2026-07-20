import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/AuthCard";
import { NewPasswordForm } from "./NewPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("newPasswordTitle"), robots: { index: false } };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("newPasswordTitle")}>
      <NewPasswordForm />
    </AuthCard>
  );
}
