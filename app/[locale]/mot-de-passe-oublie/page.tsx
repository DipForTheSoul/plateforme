import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/AuthCard";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("resetTitle")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
