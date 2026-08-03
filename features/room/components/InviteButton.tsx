"use client";
import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
export function InviteButton() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = useTranslations("Invite");
  async function copy() { try { await navigator.clipboard.writeText(location.href); setCopied(true); setFailed(false); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); setFailed(true); setTimeout(() => setFailed(false), 1800); } }
  return <button className="soft-button" onClick={copy}>{copied ? <Check size={16} /> : <Link2 size={16} />}{failed ? t("copyFailed") : copied ? t("copied") : t("invite")}</button>;
}
