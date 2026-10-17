import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/i18n/config";

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  if (!isSupportedLocale((await params).locale)) notFound();
  return children;
}
