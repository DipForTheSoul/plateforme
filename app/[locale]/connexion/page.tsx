import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations("auth");
  const { next } = await searchParams;

  return (
    <AuthCard title={t("loginTitle")}>
      <LoginForm next={next} />
    </AuthCard>
  );
}
