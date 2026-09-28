import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Información sobre cookies, almacenamiento local y publicidad en StoryFlop.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return <LegalPage title="Política de cookies" description="StoryFlop utiliza tecnologías necesarias para prestar el servicio y, con tu elección, tecnologías publicitarias de Google." updatedAt="28 de septiembre de 2026">
    <section><h2>1. Qué son las cookies</h2><p>Las cookies y tecnologías similares permiten guardar o recuperar información en el navegador. Algunas son necesarias para mantener una sesión o recordar preferencias; otras permiten medir o personalizar publicidad.</p></section>
    <section><h2>2. Tecnologías utilizadas</h2><div className="cookie-table"><div><strong>Preferencia de idioma</strong><span>Propia</span><span>Técnica</span><span>Recuerda el idioma seleccionado mediante <code>NEXT_LOCALE</code>.</span><span>Hasta 1 año</span></div><div><strong>Sesión anónima de Supabase</strong><span>Supabase / propia</span><span>Técnica</span><span>Mantiene una identidad anónima para acceder a la sala y protege sus datos. El nombre técnico puede variar o dividirse en varios fragmentos.</span><span>Durante la vigencia de la sesión</span></div><div><strong>Consentimiento publicitario</strong><span>Google</span><span>Preferencias</span><span>Conserva las decisiones comunicadas mediante la plataforma de gestión del consentimiento de Google.</span><span>Según la configuración y política de Google</span></div><div><strong>Google AdSense</strong><span>Google y proveedores publicitarios seleccionados</span><span>Publicidad</span><span>Permite mostrar, limitar, medir o personalizar anuncios en la portada según las preferencias otorgadas.</span><span>Variable según la tecnología y el proveedor</span></div></div></section>
    <section><h2>3. Cookies necesarias</h2><p>Las tecnologías de idioma y sesión son necesarias para prestar las funciones solicitadas y no se utilizan para publicidad. Deshabilitarlas o eliminarlas puede impedir que StoryFlop recuerde el idioma o mantenga el acceso a una sala.</p></section>
    <section><h2>4. Publicidad y consentimiento</h2><p>La portada incorpora Google AdSense. Para visitantes del Espacio Económico Europeo, Reino Unido y Suiza, las preferencias se solicitan mediante una plataforma de gestión del consentimiento certificada por Google. Debes poder aceptar, rechazar o configurar las finalidades con el mismo nivel de accesibilidad.</p><p>StoryFlop no carga publicidad dentro de las salas. Los proveedores y finalidades concretos se muestran en el panel de preferencias que acompaña al mensaje de consentimiento.</p></section>
    <section><h2>5. Cambiar o retirar el consentimiento</h2><p>Puedes volver a abrir el panel de Google para modificar o retirar tu elección. Si el panel todavía no está disponible, comprueba que el sitio ha sido aprobado y que el mensaje europeo está publicado en AdSense.</p><CookieSettingsButton>Gestionar preferencias de privacidad y cookies</CookieSettingsButton><p>También puedes eliminar cookies desde la configuración del navegador. Esto no impide que vuelvan a solicitarse las preferencias la próxima vez que visites el sitio.</p></section>
    <section><h2>6. Más información</h2><p>Consulta la <Link href="/privacidad">Política de privacidad</Link> para conocer las finalidades, bases jurídicas, destinatarios, conservación y derechos. Para cualquier consulta, escribe a <a href="mailto:privacy.storyflop@gmail.com">privacy.storyflop@gmail.com</a>.</p></section>
  </LegalPage>;
}
