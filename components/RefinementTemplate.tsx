"use client";
import { useState, useSyncExternalStore } from "react";
import { templateText } from "@/lib/resources";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function RefinementTemplate() {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [text, setText] = useState(templateText);
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("Plantilla copiada al portapapeles."); }
    catch { setMessage("No se pudo copiar. Selecciona el texto de la plantilla y cópialo manualmente."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "storyflop-plantilla-refinamiento.txt";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Archivo de texto preparado para descargar.");
  }
  return <section className="template-editor"><h2>Tu ficha editable</h2><p>Adapta los campos antes de copiar o descargar. Los cambios permanecen solo en esta página y se pierden al cerrarla o recargarla.</p><label htmlFor="refinement-template">Plantilla de la sesión</label><textarea id="refinement-template" value={text} readOnly={!ready} onChange={event => setText(event.target.value)} spellCheck={false} /><pre className="template-print">{text}</pre><div className="template-actions"><button className="resource-button" type="button" disabled={!ready} onClick={copy}>Copiar plantilla</button><button type="button" disabled={!ready} onClick={download}>Descargar .txt</button><button type="button" disabled={!ready} onClick={() => window.print()}>Imprimir ficha</button></div><p role="status" aria-live="polite">{message}</p><noscript><p>Puedes seleccionar y copiar el texto de la ficha. Activa JavaScript para editar, descargar o usar el botón de impresión.</p></noscript></section>;
}
