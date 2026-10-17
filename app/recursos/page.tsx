/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation keeps the Spanish document language and clears advertising runtimes. */
import type { Metadata } from "next";
import { ResourceShell } from "@/components/ResourceShell";
import { guides } from "@/lib/resources";

export const metadata: Metadata = { title: "Guías y recursos de Planning Poker", description: "Ejemplos trabajados, una demostración y una plantilla para preparar historias y facilitar sesiones de estimación con StoryFlop.", alternates: { canonical: "/recursos" } };

export default function ResourcesPage() {
  return <ResourceShell title="Una mejor conversación, antes de elegir una carta." description="Guías prácticas de Planning Poker: prepara el trabajo, descubre supuestos y conserva las decisiones de tu equipo.">
    <section className="resource-feature"><div><span className="resource-eyebrow">Empieza por aquí</span><h2>Prueba una ronda sin preparar una reunión</h2><p>Una recuperación de contraseña, tres perspectivas y un desacuerdo por resolver. Recorre un caso ficticio y comprueba qué cambia después de conversar.</p><a className="resource-button" href="/demo">Abrir la demostración →</a></div><div className="resource-card-fan" aria-hidden="true"><span>3</span><span>5</span><span>13</span></div></section>
    <section aria-labelledby="guias"><h2 id="guias">Tres guías para tu próxima sesión</h2><div className="resource-grid">{guides.map((guide, index) => <a className="resource-card" href={`/recursos/${guide.slug}`} key={guide.slug}><span className="resource-eyebrow">0{index + 1} · {guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p><span className="resource-card-link">Leer la guía →</span></a>)}</div></section>
    <section className="resource-callout"><h2>Llévate una plantilla de refinamiento</h2><p>Una ficha para escribir criterios, dependencias, votos y decisiones. Incluye un ejemplo cumplimentado y una versión editable que puedes copiar, descargar o imprimir.</p><a href="/recursos/plantilla-refinamiento">Usar la plantilla →</a></section>
    <section><h2>Cómo usar estos recursos</h2><p>Si es tu primera sesión, empieza por la demostración y la guía de inicio. Si las votaciones se atascan, revisa el caso de desacuerdo. Para preparar el backlog, utiliza los ejemplos de historias y la plantilla.</p><p>Los casos son didácticos y ficticios; las cifras ilustran conversaciones, no estimaciones universales. Puedes adaptar los materiales de esta sección al trabajo de tu equipo. <a href="/sobre-storyflop">Conoce el proyecto y cómo proponer una corrección.</a></p></section>
  </ResourceShell>;
}
