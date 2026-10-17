"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SupportedLocale } from "@/i18n/config";
import { recordResourceUsage } from "@/lib/resource-usage-client";
import { useClientReady } from "@/lib/use-client-ready";

export function RefinementTemplate({ initialText }: { initialText: string }) {
  const t = useTranslations("Resources");
  const locale = useLocale() as SupportedLocale;
  const ready = useClientReady();
  const [text, setText] = useState(initialText);
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); recordResourceUsage({ event: "template_copy", locale, resource: "template" }); setMessage(t("copied")); }
    catch { setMessage(t("copyFailed")); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = locale === "es" ? "storyflop-plantilla-refinamiento.txt" : `storyflop-refinement-${locale}.txt`;
    anchor.click();
    recordResourceUsage({ event: "template_download", locale, resource: "template" });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(t("downloadReady"));
  }
  return <section className="template-editor"><h2>{t("editable")}</h2><p>{t("editorBody")}</p><label htmlFor="refinement-template">{t("templateLabel")}</label><textarea id="refinement-template" value={text} readOnly={!ready} onChange={event => setText(event.target.value)} spellCheck={false} /><pre className="template-print">{text}</pre><div className="template-actions"><button className="resource-button" type="button" disabled={!ready} onClick={copy}>{t("copy")}</button><button type="button" disabled={!ready} onClick={download}>{t("download")}</button><button type="button" disabled={!ready} onClick={() => { recordResourceUsage({ event: "template_print", locale, resource: "template" }); window.print(); }}>{t("print")}</button></div><p role="status" aria-live="polite">{message}</p><noscript><p>{t("templateNoJs")}</p></noscript></section>;
}
