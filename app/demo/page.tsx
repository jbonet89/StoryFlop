/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation keeps the Spanish document language and clears advertising runtimes. */
import type { Metadata } from "next";
import { ResourceShell } from "@/components/ResourceShell";
import { PlanningDemo } from "@/components/PlanningDemo";

export const metadata: Metadata = { title: "Demostración de Planning Poker", description: "Prueba una ronda ficticia de StoryFlop: elige una carta, revela los votos y descubre cómo cambia la estimación al aclarar el alcance.", alternates: { canonical: "/demo" } };
export default function DemoPage() {
  return <ResourceShell title="Prueba una ronda. Descubre la conversación." description="Elige una carta, compara perspectivas y vuelve a estimar con información nueva. No necesitas una cuenta ni reunir a tu equipo.">
    <p className="resource-notice">Esta es una simulación local con personajes y votos ficticios. No crea una sala, no conecta con otros participantes ni guarda tus elecciones al salir.</p>
    <PlanningDemo />
    <section><h2>Qué estás practicando</h2><p>Votar de forma independiente hace visibles las diferencias. Revelar las cartas permite preguntar qué alcance ha considerado cada persona. La segunda ronda tiene sentido cuando esa conversación aporta información nueva.</p><p>En una sala real, cada persona vota desde su navegador y el organizador gestiona las rondas. Esta demostración representa el recorrido didáctico; sus personajes y decisiones están preparados para explicar un caso.</p><p><a href="/recursos/primera-sesion">Lee cómo preparar tu primera sesión</a> o <a href="/es#entry-title">crea una sala para tu equipo</a>.</p></section>
  </ResourceShell>;
}
