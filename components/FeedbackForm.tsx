"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/config";
import type { ResourceCopy } from "@/lib/resources";

export function FeedbackForm({ ui, locale }: { ui: ResourceCopy; locale: SupportedLocale }) {
  const [kind, setKind] = useState("idea");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error" | "limited">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), locale }),
      });
      if (!response.ok) { setState(response.status === 429 ? "limited" : "error"); return; }
      setState("success");
      form.reset();
      setKind("idea");
    } catch { setState("error"); }
  }
  return <section id="proponer-mejora" className="feedback-section" aria-labelledby="feedback-title">
    <span className="resource-eyebrow">{ui.feedbackEyebrow}</span>
    <h2 id="feedback-title">{ui.feedbackTitle}</h2>
    <p>{ui.feedbackLead}</p>
    <form className="feedback-form" onSubmit={submit} aria-busy={state === "sending"}>
      <label htmlFor="feedback-kind">{ui.feedbackKind}</label>
      <select id="feedback-kind" name="kind" value={kind} onChange={event => setKind(event.target.value)}><option value="idea">{ui.feedbackIdea}</option><option value="problem">{ui.feedbackProblem}</option></select>
      <label htmlFor="feedback-title-input">{ui.feedbackSubject}</label>
      <input id="feedback-title-input" name="title" required minLength={3} maxLength={120} />
      <label htmlFor="feedback-description">{ui.feedbackDescription}</label>
      <p id="feedback-description-hint" className="feedback-hint">{kind === "idea" ? ui.feedbackIdeaHint : ui.feedbackProblemHint}</p>
      <textarea id="feedback-description" name="description" required minLength={10} maxLength={4000} rows={6} aria-describedby="feedback-description-hint" />
      <div className="feedback-optional"><div><label htmlFor="feedback-name">{ui.feedbackName}</label><input id="feedback-name" name="name" maxLength={80} autoComplete="name" /></div><div><label htmlFor="feedback-email">{ui.feedbackEmail}</label><input id="feedback-email" name="email" type="email" maxLength={254} autoComplete="email" /></div></div>
      <p className="feedback-hint">{ui.feedbackEmailHint}</p>
      <div className="feedback-trap" aria-hidden="true"><label htmlFor="feedback-website">Website</label><input id="feedback-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <p className="feedback-hint">{ui.feedbackPrivacy} <Link href="/privacidad">{ui.privacy}</Link></p>
      <button className="resource-button" type="submit" disabled={state === "sending"}>{state === "sending" ? ui.feedbackSending : ui.feedbackSend} →</button>
      <div aria-live="polite" role="status">{state === "success" && <p className="feedback-success">{ui.feedbackSuccess}</p>}{(state === "error" || state === "limited") && <p className="feedback-error">{state === "limited" ? ui.feedbackLimited : ui.feedbackError} <a href="mailto:privacy.storyflop@gmail.com">privacy.storyflop@gmail.com</a></p>}</div>
    </form>
  </section>;
}
