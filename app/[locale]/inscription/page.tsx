import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/AuthCard";
import { SignupForm } from "./SignupForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupTitle"), robots: { index: false } };
}

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signupTitle")}>
      <SignupForm />
    </AuthCard>
  );
}
