/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation keeps the Spanish document language and clears advertising runtimes. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceShell } from "@/components/ResourceShell";
import { guides } from "@/lib/resources";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return guides.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find(item => item.slug === slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: `/recursos/${slug}` } };
}
export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = guides.find(item => item.slug === slug);
  if (!guide) notFound();
  return <ResourceShell title={guide.title} description={guide.description} editorial>
    <nav className="resource-toc" aria-label="En esta guía"><strong>En esta guía</strong><ol>{guide.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
    {guide.sections.map(section => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{"checklist" in section && section.checklist && <ul className="resource-checklist">{section.checklist.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}
    <section className="resource-callout"><h2>Pásalo a la práctica</h2><p><a href="/demo">Prueba el caso interactivo</a> o <a href="/recursos/plantilla-refinamiento">prepara tu siguiente sesión con la plantilla</a>. Cuando tengas una historia lista, <a href="/es#entry-title">crea una sala con tu equipo</a>.</p></section>
    <section><h2>Fuentes y lecturas</h2><p>Los ejemplos y las instrucciones de uso de StoryFlop son propios de esta sección. Estas fuentes permiten consultar el contexto del método y del refinamiento:</p><ul>{guide.sources.map(source => <li key={source.url}><a href={source.url} rel="noreferrer">{source.label}</a></li>)}</ul></section>
    <nav className="resource-related" aria-label="Otras guías"><h2>Sigue aprendiendo</h2>{guides.filter(item => item.slug !== slug).map(item => <a href={`/recursos/${item.slug}`} key={item.slug}>{item.title} →</a>)}</nav>
  </ResourceShell>;
}
