"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation discards the advertising runtime on non-editorial pages. */
import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SupportedLocale } from "@/i18n/config";
import { useClientReady } from "@/lib/use-client-ready";
import { recordResourceUsage } from "@/lib/resource-usage-client";
import { resourceHref } from "@/lib/resource-links";
import { ZodError } from "zod";
import { ArrowRight, Check, CircleCheck, Copy, EyeOff, Globe2, History, Infinity, Layers3, ListPlus, LockKeyhole, Radio, ShieldCheck, Sparkles, UserPlus, UsersRound, Zap } from "lucide-react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Brand } from "@/components/Brand";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { PlanningGuide } from "@/components/PlanningGuide";
import { PlanningDemo } from "@/components/PlanningDemo";
import { AdsterraPlacement } from "@/components/AdsterraPlacement";
import { AVATARS } from "@/lib/constants";
import { displayNameSchema, roomCodeSchema, roomNameSchema } from "@/lib/validation";
import { getErrorCode } from "@/lib/errors";
import { roomApi } from "../api";
import { LandingTable } from "./LandingTable";

export function LandingPage() {
  const ready = useClientReady();
  const t = useTranslations("Home");
  const r = useTranslations("Resources");
  const locale = useLocale() as SupportedLocale;
  const href = (path: string) => resourceHref(locale, path);
  const tSeo = useTranslations("LandingSeo");
  const tBrand = useTranslations("Brand");
  const tValidation = useTranslations("Validation");
  const tErrors = useTranslations("Errors");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>("🦊");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setPending(true);
    try {
      if (mode === "create") {
        const name = roomNameSchema.parse(roomName);
        const person = displayNameSchema.parse(displayName);
        const result = await roomApi.createRoom(name, person, avatar);
        recordResourceUsage({ event: "room_created", locale, resource: "home" });
        // A new document discards Auto ads and their runtime before entering a room.
        window.location.assign(`/sala/${result.code}`);
      } else {
        window.location.assign(`/sala/${roomCodeSchema.parse(code)}`);
      }
    } catch (cause) { setError(cause instanceof ZodError ? tValidation(cause.issues[0]?.message ?? "CHECK_DATA") : tErrors(getErrorCode(cause))); setPending(false); }
  }

  return <main className="landing">
    <nav className="landing-nav"><Brand showTagline /><div className="landing-nav-links"><a href={href("/demo")}>{r("demoNav")}</a><a href={href("/recursos")}>{r("resourcesNav")}</a><a href="#como-funciona">{tSeo("navHow")}</a><a href="#preguntas">{tSeo("navFaq")}</a></div><div className="landing-nav-actions"><span className="live-pill"><Radio size={14} /> {t("realtime")}</span><LanguageSelector /></div></nav>
    <div className="landing-grid">
      <section className="hero-copy">
        <div className="eyebrow"><Sparkles size={15} /> {tBrand("tagline")}</div>
        <h1>{t("heroLine1")}<br /><em>{t("heroLine2")}</em></h1>
        <p className="hero-lead">{t("lead")}</p>
        <div className="feature-row">
          <span><LockKeyhole /> {t("privateVotes")}</span><span><Radio /> {t("live")}</span><span><Layers3 /> {t("roundHistory")}</span>
        </div>
        <LandingTable readyLabel={t("ready")} />
      </section>
      <section className="entry-card" aria-labelledby="entry-title">
        <div className="mode-tabs"><button disabled={!ready} className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setError(""); }}>{t("createRoom")}</button><button disabled={!ready} className={mode === "join" ? "active" : ""} onClick={() => { setMode("join"); setError(""); }}>{t("joinWithCode")}</button></div>
        <form onSubmit={submit}>
          <div className="card-heading"><h2 id="entry-title">{mode === "create" ? t("prepareTable") : t("joinTeam")}</h2><p>{mode === "create" ? t("createDetail") : t("joinDetail")}</p></div>
          {mode === "create" ? <>
            <label>{t("roomName")}<input autoFocus value={roomName} onChange={e => setRoomName(e.target.value)} placeholder={t("roomNamePlaceholder")} maxLength={60} /></label>
            <label>{t("yourName")}<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t("namePlaceholder")} maxLength={32} /></label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </> : <label>{t("roomCode")}<input autoFocus className="code-input" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="K7M4P9Q2" maxLength={8} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending || !ready}>{pending ? t("preparing") : mode === "create" ? t("createRoom") : t("enterRoom")}<ArrowRight size={18} /></button>
          <p className="privacy-note"><Check size={14} /> {t("privacy")}</p>
        </form>
      </section>
    </div>
    <section className="seo-section landing-demo" aria-labelledby="landing-demo-title">
      <div className="seo-heading"><span>{r("landingDemoEyebrow")}</span><h2 id="landing-demo-title">{r("demoTitle")}</h2><p>{r("demoLead")}</p></div>
      <p className="resource-notice">{r("simulation")}</p>
      <PlanningDemo />
      <p>{r("realRoom")}</p>
      <a className="resource-button" href="#entry-title">{r("createTeamRoom")} →</a>
    </section>
    <AdsterraPlacement kind="banner" />
    <section className="seo-section landing-resources" aria-labelledby="resources-title">
      <div className="seo-heading"><span>{r("learn")}</span><h2 id="resources-title">{r("resourcesNav")}</h2></div>
      <div className="resource-grid">
        <a className="resource-card" href={href("/demo")}><span className="resource-eyebrow">{r("landingDemoEyebrow")}</span><h3>{r("landingDemoTitle")}</h3><p>{r("landingDemoBody")}</p><span className="resource-card-link">{r("landingDemoLink")} →</span></a>
        <a className="resource-card" href={href("/recursos")}><span className="resource-eyebrow">{r("landingGuidesEyebrow")}</span><h3>{r("landingGuidesTitle")}</h3><p>{r("landingGuidesBody")}</p><span className="resource-card-link">{r("landingGuidesLink")} →</span></a>
        <a className="resource-card" href={href("/recursos/plantilla-refinamiento")}><span className="resource-eyebrow">{r("landingTemplateEyebrow")}</span><h3>{r("landingTemplateTitle")}</h3><p>{r("landingTemplateBody")}</p><span className="resource-card-link">{r("useTemplate")} →</span></a>
      </div>
      <p className="landing-project-link"><a href={href("/sobre-storyflop")}>{r("projectNav")} →</a></p>
    </section>
    <PlanningGuide />
    <section className="seo-section how-section" id="como-funciona">
      <div className="seo-heading"><span>{tSeo("howEyebrow")}</span><h2>{tSeo("howTitle")}</h2><p>{tSeo("howLead")}</p></div>
      <ol className="step-grid">
        <li><b>1</b><div><h3>{tSeo("step1Title")}</h3><p>{tSeo("step1Body")}</p></div></li>
        <li><b>2</b><div><h3>{tSeo("step2Title")}</h3><p>{tSeo("step2Body")}</p></div></li>
        <li><b>3</b><div><h3>{tSeo("step3Title")}</h3><p>{tSeo("step3Body")}</p></div></li>
      </ol>
    </section>
    <section className="seo-section feature-section" id="funciones">
      <div className="seo-heading"><span>{tSeo("featuresEyebrow")}</span><h2>{tSeo("featuresTitle")}</h2><p>{tSeo("featuresLead")}</p></div>
      <div className="seo-feature-grid">
        <article><EyeOff /><h3>{tSeo("privateTitle")}</h3><p>{tSeo("privateBody")}</p></article>
        <article><Zap /><h3>{tSeo("realtimeTitle")}</h3><p>{tSeo("realtimeBody")}</p></article>
        <article><History /><h3>{tSeo("historyTitle")}</h3><p>{tSeo("historyBody")}</p></article>
        <article><UsersRound /><h3>{tSeo("rolesTitle")}</h3><p>{tSeo("rolesBody")}</p></article>
        <article><Globe2 /><h3>{tSeo("remoteTitle")}</h3><p>{tSeo("remoteBody")}</p></article>
        <article><ShieldCheck /><h3>{tSeo("privacyTitle")}</h3><p>{tSeo("privacyBody")}</p></article>
        <article><Infinity /><h3>{tSeo("unlimitedRoundsTitle")}</h3><p>{tSeo("unlimitedRoundsBody")}</p></article>
        <article><UserPlus /><h3>{tSeo("unlimitedPeopleTitle")}</h3><p>{tSeo("unlimitedPeopleBody")}</p></article>
        <article><ListPlus /><h3>{tSeo("collaboratorsTitle")}</h3><p>{tSeo("collaboratorsBody")}</p></article>
      </div>
    </section>
    <section className="seo-section use-cases">
      <div className="seo-heading"><span>{tSeo("useEyebrow")}</span><h2>{tSeo("useTitle")}</h2><p>{tSeo("useLead")}</p></div>
      <div className="use-case-grid"><article><CircleCheck /><div><h3>{tSeo("refinementTitle")}</h3><p>{tSeo("refinementBody")}</p></div></article><article><CircleCheck /><div><h3>{tSeo("planningTitle")}</h3><p>{tSeo("planningBody")}</p></div></article><article><CircleCheck /><div><h3>{tSeo("remoteTeamsTitle")}</h3><p>{tSeo("remoteTeamsBody")}</p></div></article></div>
    </section>
    <AdsterraPlacement kind="native" />
    <section className="seo-section faq-section" id="preguntas">
      <div className="seo-heading"><span>{tSeo("faqEyebrow")}</span><h2>{tSeo("faqTitle")}</h2></div>
      <div className="faq-with-ad">
        <div className="faq-list">
          <details><summary>{tSeo("faq1Question")}</summary><p>{tSeo("faq1Answer")}</p></details>
          <details><summary>{tSeo("faq2Question")}</summary><p>{tSeo("faq2Answer")}</p></details>
          <details><summary>{tSeo("faq3Question")}</summary><p>{tSeo("faq3Answer")}</p></details>
          <details><summary>{tSeo("faq4Question")}</summary><p>{tSeo("faq4Answer")}</p></details>
          <details><summary>{tSeo("faq5Question")}</summary><p>{tSeo("faq5Answer")}</p></details>
        </div>
          </div>
    </section>
    <section className="seo-cta"><div><span>{tSeo("ctaEyebrow")}</span><h2>{tSeo("ctaTitle")}</h2><p>{tSeo("ctaBody")}</p></div><a href="#entry-title">{tSeo("ctaButton")}<ArrowRight size={18} /></a></section>
    <footer className="landing-footer"><span>{t("footerTime")}</span><nav aria-label={tSeo("footerNavLabel")}><a href="#guia">{tSeo("guideNav")}</a><a href="#como-funciona">{tSeo("navHow")}</a><a href="#funciones">{tSeo("navFeatures")}</a><a href="#preguntas">{tSeo("navFaq")}</a><a href="/aviso-legal">{tSeo("legalNotice")}</a><a href="/privacidad">{tSeo("privacyPolicy")}</a><a href="/cookies">{tSeo("cookiesPolicy")}</a><CookieSettingsButton>{tSeo("privacySettings")}</CookieSettingsButton></nav><span><Copy size={13} /> {t("footerShare")}</span></footer>
  </main>;
}
