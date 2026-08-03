"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { REACTIONS } from "@/lib/constants";
import { advanceReactionBurst, MAX_REACTIONS_PER_OPEN, reactionSendDelay } from "@/lib/reactions";

export function EmojiPicker({ targetName, onSelect, onClose }: { targetName: string; onSelect: (emoji: string) => void; onClose: () => void }) {
  const t = useTranslations("Reactions");
  const sentCountRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) onClose(); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [onClose]);

  function choose(emoji: string) {
    if (sentCountRef.current >= MAX_REACTIONS_PER_OPEN) return;
    const selectionIndex = sentCountRef.current;
    const next = advanceReactionBurst(sentCountRef.current);
    sentCountRef.current = next.count;
    window.setTimeout(() => onSelect(emoji), reactionSendDelay(selectionIndex));
    if (next.shouldClose) onClose();
  }
  function moveFocus(index: number, key: string) {
    const columns = 7;
    const delta = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : key === "ArrowDown" ? columns : -columns;
    resultRefs.current[(index + delta + REACTIONS.length) % REACTIONS.length]?.focus();
  }

  return <div className="reaction-popover" ref={rootRef} role="dialog" aria-label={t("dialog", { name: targetName })}>
    <div className="emoji-picker-heading"><span>{t("sendTo", { name: targetName })}</span><button onClick={onClose} aria-label={t("close")}><X size={14} /></button></div>
    <div className="reaction-grid" role="grid" aria-label={t("available")}>{REACTIONS.map((option, index) => { const label = t(`emoji.${option.label}`); return <button ref={element => { resultRefs.current[index] = element; }} role="gridcell" aria-rowindex={Math.floor(index / 7) + 1} aria-colindex={(index % 7) + 1} key={option.emoji} title={label} aria-label={t("send", { label, name: targetName })} onKeyDown={event => { if (event.key.startsWith("Arrow")) { event.preventDefault(); moveFocus(index, event.key); } }} onClick={() => choose(option.emoji)}>{option.emoji}</button>; })}</div>
  </div>;
}
