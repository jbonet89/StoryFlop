/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation clears the advertising runtime. */
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ResourceShell } from "@/components/ResourceShell";
import { PlanningDemo } from "@/components/PlanningDemo";
import { RefinementTemplate } from "@/components/RefinementTemplate";
import { getResourceContent } from "@/lib/resources";
import { resourceAlternates, resourceHref } from "@/lib/resource-links";
import type { SupportedLocale } from "@/i18n/config";

type PageKind = "index" | "demo" | "template" | "about";
const paths: Record<PageKind, string> = { index: "/recursos", demo: "/demo", template: "/recursos/plantilla-refinamiento", about: "/sobre-storyflop" };
async function content() {
  const locale = await getLocale() as SupportedLocale;
  return { locale, ...await getResourceContent(locale), href: (path: string) => resourceHref(locale, path) };
}
export async function resourceMetadata(kind: PageKind, slug?: string): Promise<Metadata> {
  const { locale, ui, guides } = await content();
  const guide = slug ? guides.find(item => item.slug === slug) : undefined;
  if (slug && !guide) return {};
  const path = guide ? `/recursos/${guide.slug}` : paths[kind];
  const title = guide?.title ?? ui[`${kind}Meta`];
  const description = guide?.description ?? ui[`${kind}Description`];
  const socialLocales: Record<SupportedLocale, string> = { es: "es_ES", en: "en_US", fr: "fr_FR", it: "it_IT", de: "de_DE", pt: "pt_PT", ca: "ca_ES", eu: "eu_ES", ru: "ru_RU" };
  return { title, description, alternates: { canonical: resourceHref(locale, path), languages: resourceAlternates(path) }, openGraph: { title, description, url: resourceHref(locale, path), locale: socialLocales[locale] }, twitter: { card: "summary_large_image", title, description } };
}

export async function ResourcesPage() {
  const { ui, guides, href } = await content();
  return <ResourceShell title={ui.indexTitle} description={ui.indexLead}>
    <section className="resource-feature"><div><span className="resource-eyebrow">{ui.startHere}</span><h2>{ui.tryRound}</h2><p>{ui.tryRoundBody}</p><a className="resource-button" href={href("/demo")}>{ui.openDemo} →</a></div><div className="resource-card-fan" aria-hidden="true"><span>3</span><span>5</span><span>13</span></div></section>
    <section aria-labelledby="guias"><h2 id="guias">{ui.threeGuides}</h2><div className="resource-grid">{guides.map((guide, index) => <a className="resource-card" href={href(`/recursos/${guide.slug}`)} key={guide.slug}><span className="resource-eyebrow">0{index + 1} · {guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p><span className="resource-card-link">{ui.readGuide} →</span></a>)}</div></section>
    <section className="resource-callout"><h2>{ui.takeTemplate}</h2><p>{ui.takeTemplateBody}</p><a href={href("/recursos/plantilla-refinamiento")}>{ui.useTemplate} →</a></section>
    <section><h2>{ui.useResources}</h2><p>{ui.useResourcesBody}</p><p>{ui.fictionNotice} <a href={href("/sobre-storyflop")}>{ui.projectLink}</a></p></section>
  </ResourceShell>;
}
export async function GuidePage({ slug }: { slug: string }) {
  const { ui, guides, href } = await content();
  const guide = guides.find(item => item.slug === slug);
  if (!guide) notFound();
  return <ResourceShell title={guide.title} description={guide.description} editorial>
    <nav className="resource-toc" aria-label={ui.toc}><strong>{ui.toc}</strong><ol>{guide.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
    {guide.sections.map(section => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.checklist && <ul className="resource-checklist">{section.checklist.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}
    <section className="resource-callout"><h2>{ui.practice}</h2><p><a href={href("/demo")}>{ui.interactiveCase} →</a></p><p><a href={href("/recursos/plantilla-refinamiento")}>{ui.prepareTemplate} →</a></p><p><a href={`/${(await getLocale())}#entry-title`}>{ui.createTeamRoom} →</a></p></section>
    <section><h2>{ui.sources}</h2><p>{ui.sourcesBody}</p><ul>{guide.sources.map(source => <li key={source.url}><a href={source.url} rel="noreferrer">{source.label}</a></li>)}</ul></section>
    <nav className="resource-related" aria-label={ui.otherGuides}><h2>{ui.related}</h2>{guides.filter(item => item.slug !== slug).map(item => <a href={href(`/recursos/${item.slug}`)} key={item.slug}>{item.title} →</a>)}</nav>
  </ResourceShell>;
}
export async function DemoPage() {
  const { ui, href, locale } = await content();
  return <ResourceShell title={ui.demoTitle} description={ui.demoLead}><p className="resource-notice">{ui.simulation}</p><PlanningDemo />
    <section><h2>{ui.practicing}</h2><p>{ui.practicingBody}</p><p>{ui.realRoom}</p><p><a href={href("/recursos/primera-sesion")}>{ui.firstGuide} →</a></p><p><a href={`/${locale}#entry-title`}>{ui.createTeamRoom} →</a></p></section>
  </ResourceShell>;
}
export async function TemplatePage() {
  const { ui, templateText, href, locale } = await content();
  const exampleKeys = ["Story", "Criteria", "Dependencies", "Votes", "Info", "Decision", "Review"] as const;
  return <ResourceShell title={ui.templateTitle} description={ui.templateLead} editorial>
    <section><h2>{ui.howTo}</h2><ol>{(["instruction1", "instruction2", "instruction3", "instruction4"] as const).map(key => <li key={key}>{ui[key]}</li>)}</ol><p>{ui.templatePermission}</p></section>
    <RefinementTemplate key={locale} initialText={templateText.replace("https://storyflop.com/recursos/plantilla-refinamiento", `https://storyflop.com${href("/recursos/plantilla-refinamiento")}`)} />
    <section className="resource-callout"><h2>{ui.exampleTitle}</h2><dl className="template-example">{exampleKeys.map(key => <div key={key}><dt>{ui[`example${key}`]}</dt><dd>{ui[`example${key}Body`]}</dd></div>)}</dl></section>
    <section><h2>{ui.missingInfo}</h2><p>{ui.missingInfoBody}</p><p><a href={href("/recursos/historias-listas-para-estimar")}>{ui.threeExamples} →</a></p><p><a href={href("/demo")}>{ui.openDemo} →</a></p></section>
  </ResourceShell>;
}
export async function AboutPage() {
  const { ui, href } = await content();
  return <ResourceShell title={ui.aboutTitle} description={ui.aboutLead}>
    <section><h2>{ui.purpose}</h2><p>{ui.purposeBody}</p><p>{ui.featuresBody}</p><p>{ui.retentionBody} <a href="/privacidad">{ui.privacy}</a></p></section>
    <section><h2>{ui.owner}</h2><p>{ui.ownerBody} <a href="/aviso-legal">{ui.legal}</a></p><p>{ui.authorship}</p></section>
    <section><h2>{ui.editorial}</h2><p>{ui.editorialBody}</p><p>{ui.correctionsBody}</p></section>
    <section className="resource-callout"><h2>{ui.contact}</h2><p>{ui.contactBody}</p><p><a href="mailto:privacy.storyflop@gmail.com">privacy.storyflop@gmail.com</a></p><p>{ui.reportBody}</p></section>
    <p><a href={href("/demo")}>{ui.openDemo} →</a></p><p><a href={href("/recursos")}>{ui.resourcesNav} →</a></p>
  </ResourceShell>;
}
