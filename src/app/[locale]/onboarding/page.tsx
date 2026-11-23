import { notFound } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import OnboardingForm from "@/components/auth/OnboardingForm";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const dictionary = await getDictionary(localeParam);
  return (
    <AuthShell locale={localeParam} dictionary={dictionary}>
      <OnboardingForm locale={localeParam} dictionary={dictionary} />
    </AuthShell>
  );
}
