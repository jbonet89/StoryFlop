"use client";
import { useTranslations } from "next-intl";
import { AVATARS } from "@/lib/constants";
export function AvatarPicker({ value, onChange }: { value: string; onChange: (value: (typeof AVATARS)[number]) => void }) {
  const t = useTranslations("Home");
  return <fieldset className="avatar-field"><legend>{t("chooseAvatar")}</legend><div className="avatar-picker">{AVATARS.map(avatar => <button type="button" key={avatar} className={value === avatar ? "avatar active" : "avatar"} aria-label={t("avatarLabel", { avatar })} aria-pressed={value === avatar} onClick={() => onChange(avatar)}>{avatar}</button>)}</div></fieldset>;
}
