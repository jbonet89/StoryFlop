/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation clears the advertising runtime. */
import { getLocale, getTranslations } from "next-intl/server";
import { Brand } from "@/components/Brand";
import { LanguageSelector } from "@/components/LanguageSelector";
import { localeNames, type SupportedLocale } from "@/i18n/config";
import { resourceHref } from "@/lib/resource-links";
import { resourceDate } from "@/lib/resources";

export async function ResourceShell({ title, description, children, editorial = false }: { title: string; description: string; children: React.ReactNode; editorial?: boolean }) {
  const locale = await getLocale() as SupportedLocale;
  const t = await getTranslations("Resources");
  const href = (path: string) => resourceHref(locale, path);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(resourceDate));
  return <main className="resource-shell" lang={locale}>
    <a className="resource-skip" href="#contenido">{t("skip")}</a>
    <header className="resource-header"><a href={`/${locale}`} aria-label={t("home")}><Brand /></a><nav aria-label={t("navigation")}><a href={href("/demo")}>{t("demoNav")}</a><a href={href("/recursos")}>{t("resourcesNav")}</a><a href={href("/sobre-storyflop")}>{t("projectNav")}</a><a href={`/${locale}#entry-title`} className="resource-start">{t("createRoom")}</a></nav><LanguageSelector compact /></header>
    <article id="contenido" className="resource-document">
      <header className="resource-intro"><a className="resource-eyebrow" href={href("/recursos")}>{t("learn")} · {localeNames[locale]}</a><h1>{title}</h1><p>{description}</p>{editorial && <p className="resource-byline">{t("byline")} · <a href={href("/sobre-storyflop")}>{t("aboutResources")}</a> · {t("published")} <time dateTime={resourceDate}>{date}</time></p>}</header>
      {children}
    </article>
    <footer className="resource-footer"><a href={href("/recursos")}>{t("resourcesNav")}</a><a href={href("/sobre-storyflop")}>{t("projectContact")}</a><a href="/aviso-legal">{t("legal")}{locale !== "es" && " (ES)"}</a><a href="/privacidad">{t("privacy")}{locale !== "es" && " (ES)"}</a><a href="/cookies">{t("cookies")}{locale !== "es" && " (ES)"}</a></footer>
  </main>;
}
