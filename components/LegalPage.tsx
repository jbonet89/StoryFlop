import Link from "next/link";
import { Brand } from "@/components/Brand";

export function LegalPage({ title, description, updatedAt, children }: { title: string; description: string; updatedAt: string; children: React.ReactNode }) {
  return <main className="legal-shell">
    <header className="legal-header"><Link href="/" aria-label="Volver a StoryFlop"><Brand showTagline /></Link><Link className="legal-back" href="/">Volver a la portada</Link></header>
    <article className="legal-document">
      <header><span>StoryFlop</span><h1>{title}</h1><p>{description}</p><small>Última actualización: {updatedAt}</small></header>
      {children}
    </article>
    <footer className="legal-footer">
      <Link href="/aviso-legal">Aviso legal</Link>
      <Link href="/privacidad">Privacidad</Link>
      <Link href="/cookies">Cookies</Link>
      <a href="mailto:privacy.storyflop@gmail.com">privacy.storyflop@gmail.com</a>
    </footer>
  </main>;
}
