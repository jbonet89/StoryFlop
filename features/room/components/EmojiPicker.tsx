"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { REACTIONS } from "@/lib/constants";
import { advanceReactionBurst, MAX_REACTIONS_PER_OPEN, REACTION_HOLD_THRESHOLD_MS, reactionScaleForHold, reactionSendDelay } from "@/lib/reactions";

export function EmojiPicker({ targetName, onSelect, onClose }: { targetName: string; onSelect: (emoji: string, scale?: number) => void; onClose: () => void }) {
  const t = useTranslations("Reactions");
  const sentCountRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pressRef = useRef<{ emoji: string; startedAt: number; pointerId: number } | null>(null);
  const [chargingEmoji, setChargingEmoji] = useState<string | null>(null);

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
  function startCharging(event: ReactPointerEvent<HTMLButtonElement>, emoji: string) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current = { emoji, startedAt: event.timeStamp, pointerId: event.pointerId };
    setChargingEmoji(emoji);
  }
  function releaseCharging(event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;
    pressRef.current = null;
    setChargingEmoji(null);
    if (cancelled) return;
    const duration = event.timeStamp - press.startedAt;
    if (duration < REACTION_HOLD_THRESHOLD_MS) {
      choose(press.emoji);
      return;
    }
    onSelect(press.emoji, reactionScaleForHold(duration));
    onClose();
  }
  function moveFocus(index: number, key: string) {
    const columns = 7;
    const delta = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : key === "ArrowDown" ? columns : -columns;
    resultRefs.current[(index + delta + REACTIONS.length) % REACTIONS.length]?.focus();
  }

  return <div className="reaction-popover" ref={rootRef} role="dialog" aria-label={t("dialog", { name: targetName })}>
    <div className="emoji-picker-heading"><span>{t("sendTo", { name: targetName })}</span><button onClick={onClose} aria-label={t("close")}><X size={14} /></button></div>
    <div className="reaction-grid" role="grid" aria-label={t("available")}>{REACTIONS.map((option, index) => { const label = t(`emoji.${option.label}`); return <button ref={element => { resultRefs.current[index] = element; }} role="gridcell" aria-rowindex={Math.floor(index / 7) + 1} aria-colindex={(index % 7) + 1} className={chargingEmoji === option.emoji ? "charging" : ""} key={option.emoji} title={label} aria-label={t("send", { label, name: targetName })} onKeyDown={event => { if (event.key.startsWith("Arrow")) { event.preventDefault(); moveFocus(index, event.key); } }} onPointerDown={event => startCharging(event, option.emoji)} onPointerUp={releaseCharging} onPointerCancel={event => releaseCharging(event, true)} onClick={event => { if (event.detail === 0) choose(option.emoji); }}>{option.emoji}</button>; })}</div>
  </div>;
}
