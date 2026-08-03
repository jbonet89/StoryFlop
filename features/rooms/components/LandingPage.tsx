"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ZodError } from "zod";
import { ArrowRight, Check, Copy, Layers3, LockKeyhole, Radio, Sparkles } from "lucide-react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Brand } from "@/components/Brand";
import { AVATARS } from "@/lib/constants";
import { displayNameSchema, roomCodeSchema, roomNameSchema } from "@/lib/validation";
import { getErrorCode } from "@/lib/errors";
import { roomApi } from "../api";

export function LandingPage() {
  const router = useRouter();
  const t = useTranslations("Home");
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
        router.push(`/sala/${result.code}`);
      } else {
        router.push(`/sala/${roomCodeSchema.parse(code)}`);
      }
    } catch (cause) { setError(cause instanceof ZodError ? tValidation(cause.issues[0]?.message ?? "CHECK_DATA") : tErrors(getErrorCode(cause))); setPending(false); }
  }

  return <main className="landing">
    <nav className="landing-nav"><Brand showTagline /><div className="landing-nav-actions"><span className="live-pill"><Radio size={14} /> {t("realtime")}</span><LanguageSelector /></div></nav>
    <div className="landing-grid">
      <section className="hero-copy">
        <div className="eyebrow"><Sparkles size={15} /> {tBrand("tagline")}</div>
        <h1>{t("heroLine1")}<br /><em>{t("heroLine2")}</em></h1>
        <p className="hero-lead">{tBrand("claim")}</p>
        <div className="feature-row">
          <span><LockKeyhole /> {t("privateVotes")}</span><span><Radio /> {t("live")}</span><span><Layers3 /> {t("roundHistory")}</span>
        </div>
        <div className="mini-table" aria-hidden="true">
          <span className="mini-seat s1">🐼</span><span className="mini-seat s2">🐙</span><span className="mini-seat s3">🦁</span>
          <div className="mini-felt"><span>SPRINT 24</span><strong>{t("ready")}</strong><div><i>3</i><i>5</i><i>8</i></div></div>
          <span className="mini-seat s4">🐸</span><span className="mini-seat s5">🦊</span>
        </div>
      </section>
      <section className="entry-card" aria-labelledby="entry-title">
        <div className="mode-tabs"><button className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setError(""); }}>{t("createRoom")}</button><button className={mode === "join" ? "active" : ""} onClick={() => { setMode("join"); setError(""); }}>{t("joinWithCode")}</button></div>
        <form onSubmit={submit}>
          <div className="card-heading"><h2 id="entry-title">{mode === "create" ? t("prepareTable") : t("joinTeam")}</h2><p>{mode === "create" ? t("createDetail") : t("joinDetail")}</p></div>
          {mode === "create" ? <>
            <label>{t("roomName")}<input autoFocus value={roomName} onChange={e => setRoomName(e.target.value)} placeholder={t("roomNamePlaceholder")} maxLength={60} /></label>
            <label>{t("yourName")}<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t("namePlaceholder")} maxLength={32} /></label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </> : <label>{t("roomCode")}<input autoFocus className="code-input" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="K7M4P9Q2" maxLength={8} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending}>{pending ? t("preparing") : mode === "create" ? t("createRoom") : t("enterRoom")}<ArrowRight size={18} /></button>
          <p className="privacy-note"><Check size={14} /> {t("privacy")}</p>
        </form>
      </section>
    </div>
    <footer className="landing-footer"><span>{t("footerTime")}</span><span><Copy size={13} /> {t("footerShare")}</span></footer>
  </main>;
}
