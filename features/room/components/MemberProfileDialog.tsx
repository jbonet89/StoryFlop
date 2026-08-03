"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { ZodError } from "zod";
import { AvatarPicker } from "@/components/AvatarPicker";
import { AVATARS } from "@/lib/constants";
import type { Member } from "@/lib/types";
import { displayNameSchema } from "@/lib/validation";

export function MemberProfileDialog({ member, onClose, onSave }: { member: Member; onClose: () => void; onSave: (displayName: string, avatar: (typeof AVATARS)[number]) => Promise<boolean> }) {
  const t = useTranslations("Members");
  const tValidation = useTranslations("Validation");
  const [name, setName] = useState(member.display_name);
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>(member.avatar_key as (typeof AVATARS)[number]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const validName = displayNameSchema.parse(name);
      setSaving(true);
      if (await onSave(validName, avatar)) onClose();
    } catch (cause) {
      if (cause instanceof ZodError) setError(tValidation(cause.issues[0]?.message ?? "CHECK_DATA"));
    } finally {
      setSaving(false);
    }
  }

  return <div className="profile-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
      <header><div><span>{member.avatar_key}</span><div><small>{t("yourProfile")}</small><h2 id="profile-dialog-title">{t("editProfile")}</h2></div></div><button type="button" className="icon-button" aria-label={t("closeProfile")} onClick={onClose}><X size={18} /></button></header>
      <form onSubmit={submit}>
        <label>{t("displayName")}<input autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={32} /></label>
        <AvatarPicker value={avatar} onChange={setAvatar} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={saving || (name.trim() === member.display_name && avatar === member.avatar_key)}>{saving ? t("savingProfile") : t("saveProfile")}</button>
      </form>
    </section>
  </div>;
}
