/* eslint-disable @next/next/no-html-link-for-pages -- A new document clears the advertising runtime when leaving the landing. */
import { Brand } from "@/components/Brand";

export function ResourceShell({ title, description, children, editorial = false }: { title: string; description: string; children: React.ReactNode; editorial?: boolean }) {
  return <main className="resource-shell" lang="es">
    <a className="resource-skip" href="#contenido">Saltar al contenido</a>
    <header className="resource-header"><a href="/es" aria-label="StoryFlop, inicio"><Brand /></a><nav aria-label="Navegación principal"><a href="/demo">Demostración</a><a href="/recursos">Guías y recursos</a><a href="/sobre-storyflop">El proyecto</a><a href="/es#entry-title" className="resource-start">Crear sala</a></nav></header>
    <article id="contenido" className="resource-document">
      <header className="resource-intro"><a className="resource-eyebrow" href="/recursos">Aprender con StoryFlop · Español</a><h1>{title}</h1><p>{description}</p>{editorial && <p className="resource-byline">Por StoryFlop · <a href="/sobre-storyflop">Sobre estos recursos</a> · Publicado el <time dateTime="2026-10-17">17 de octubre de 2026</time></p>}</header>
      {children}
    </article>
    <footer className="resource-footer"><a href="/recursos">Guías y recursos</a><a href="/sobre-storyflop">Proyecto y contacto</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a></footer>
  </main>;
}
