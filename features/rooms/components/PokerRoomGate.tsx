"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ZodError } from "zod";
import { useTranslations } from "next-intl";
import { DoorOpen, LoaderCircle } from "lucide-react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Brand, BrandMark } from "@/components/Brand";
import { AVATARS } from "@/lib/constants";
import { displayNameSchema, roomCodeSchema } from "@/lib/validation";
import { getErrorCode } from "@/lib/errors";
import { roomApi } from "../api";
import { useRoom } from "../hooks";
import { PokerRoom } from "./PokerRoom";

export function PokerRoomGate({ code }: { code: string }) {
  const t = useTranslations("RoomGate");
  const tHome = useTranslations("Home");
  const tValidation = useTranslations("Validation");
  const tErrors = useTranslations("Errors");
  const validCode = roomCodeSchema.safeParse(code);
  const query = useRoom(validCode.success ? validCode.data : code);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>("🦊");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!validCode.success) return <RoomState title={t("invalidCode")} detail={t("invalidCodeDetail")} backLabel={t("backHome")} />;
  if (query.isLoading) return <RoomState title={t("preparingTable")} detail={t("restoringSeat")} backLabel={t("backHome")} loading />;
  if (query.data) return <PokerRoom snapshot={query.data} code={validCode.data} realtimeStatus={query.realtimeStatus} />;

  async function join(event: FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    try { await roomApi.joinRoom(validCode.data!, displayNameSchema.parse(name), avatar); await query.refetch(); }
    catch (cause) { setError(cause instanceof ZodError ? tValidation(cause.issues[0]?.message ?? "CHECK_DATA") : tErrors(getErrorCode(cause))); setPending(false); }
  }
  return <main className="join-screen"><div className="join-shell"><div className="join-brand"><Brand /><LanguageSelector /></div><section className="join-card"><span className="room-code-label">{t("roomCode", { code: validCode.data })}</span><h1>{t("joinTitle")}</h1><p>{t("joinDetail")}</p><form onSubmit={join}><label>{tHome("yourName")}<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={tHome("namePlaceholder")} maxLength={32} /></label><AvatarPicker value={avatar} onChange={setAvatar} />{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={pending}>{pending ? t("entering") : t("sit")}<DoorOpen size={18} /></button></form></section></div></main>;
}

function RoomState({ title, detail, backLabel, loading }: { title: string; detail: string; backLabel: string; loading?: boolean }) {
  return <main className="join-screen"><div className="state-shell"><Brand /><div className="state-card">{loading ? <LoaderCircle className="spin" /> : <BrandMark decorative className="state-mark" />}<h1>{title}</h1><p>{detail}</p>{!loading && <Link href="/">{backLabel}</Link>}</div></div></main>;
}
