import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Información legal e identificativa del titular de StoryFlop.",
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return <LegalPage title="Aviso legal" description="Información sobre el titular, las condiciones de uso y las responsabilidades aplicables a StoryFlop." updatedAt="28 de septiembre de 2026">
    <section><h2>1. Titular del sitio web</h2><dl className="legal-details"><div><dt>Titular</dt><dd>Jaume Bonet Martín</dd></div><div><dt>NIF</dt><dd>47902690S</dd></div><div><dt>Domicilio</dt><dd>Carrer Mas, 114, 08904 L’Hospitalet de Llobregat (Barcelona), España</dd></div><div><dt>Correo electrónico</dt><dd><a href="mailto:privacy.storyflop@gmail.com">privacy.storyflop@gmail.com</a></dd></div><div><dt>Dominio</dt><dd><a href="https://storyflop.com">storyflop.com</a></dd></div></dl></section>
    <section><h2>2. Objeto</h2><p>StoryFlop es una aplicación web gratuita de Scrum Poker y Planning Poker que permite crear salas, invitar participantes y realizar estimaciones colaborativas en tiempo real. El titular presta el servicio como particular.</p></section>
    <section><h2>3. Condiciones de uso</h2><p>La persona usuaria se compromete a utilizar StoryFlop de forma lícita, respetuosa y conforme a estas condiciones. No debe introducir contenido ilícito, lesivo, confidencial sin autorización, malware ni enlaces destinados a perjudicar a otras personas o sistemas.</p><p>Quien crea o utiliza una sala es responsable de contar con autorización para compartir nombres, descripciones, enlaces y cualquier otra información introducida en ella.</p></section>
    <section><h2>4. Disponibilidad del servicio</h2><p>StoryFlop se ofrece sin garantía de disponibilidad ininterrumpida. El titular puede efectuar tareas de mantenimiento, introducir mejoras o suspender temporalmente funciones por motivos técnicos, de seguridad o legales. Esto no limita los derechos que correspondan legalmente a las personas usuarias.</p></section>
    <section><h2>5. Propiedad intelectual</h2><p>El diseño, la marca, el código y los elementos propios de StoryFlop están protegidos por la normativa de propiedad intelectual e industrial aplicable. El contenido que las personas usuarias incorporan a una sala continúa perteneciendo a sus respectivos titulares.</p></section>
    <section><h2>6. Enlaces externos</h2><p>Las salas pueden contener enlaces añadidos por sus participantes. StoryFlop no controla su contenido ni responde de su disponibilidad, seguridad o exactitud. Acceder a ellos queda bajo la responsabilidad de la persona usuaria.</p></section>
    <section><h2>7. Protección de datos y cookies</h2><p>El tratamiento de datos personales se explica en la <Link href="/privacidad">Política de privacidad</Link>. El uso de almacenamiento local, cookies técnicas y tecnologías publicitarias se detalla en la <Link href="/cookies">Política de cookies</Link>.</p></section>
    <section><h2>8. Legislación aplicable</h2><p>Este sitio se rige por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que correspondan conforme a las normas imperativas de competencia y protección de consumidores.</p></section>
  </LegalPage>;
}
