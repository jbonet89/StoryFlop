"use client";
import { useCallback, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { Member, ParticipationMode, Vote } from "@/lib/types";
import type { SeatPosition } from "@/lib/seats";
import { Crown, Eye } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

export function PlayerSeat({ member, position, compact, online, participationMode, roundActive, voted, vote, revealed, isMe, onReact, onEditProfile }: { member: Member; position: SeatPosition; compact: boolean; online: boolean; participationMode: ParticipationMode; roundActive: boolean; voted: boolean; vote?: Vote; revealed: boolean; isMe: boolean; onReact: (emoji: string) => void; onEditProfile: () => void }) {
  const t = useTranslations("Members");
  const [pickerOpen, setPickerOpen] = useState(false);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const style = { "--seat-x": position.xPercent, "--seat-y": position.yPercent } as CSSProperties;
  const participationLabel = participationMode === "observer" ? t("observer") : roundActive ? t("voterStatus", { status: voted ? t("voted") : t("pending") }) : t("voter");
  const connectionLabel = online ? t("connected") : t("disconnected");
  return <div className={`player-seat ${isMe ? "me" : ""} ${compact ? "compact" : ""} ${participationMode === "observer" ? "observer" : ""}`} style={style} data-player-id={member.id} data-participation-mode={participationMode}>
    <button className="seat-main" title={isMe ? t("editProfile") : member.display_name} onClick={() => isMe ? onEditProfile() : setPickerOpen(open => !open)} aria-expanded={!isMe ? pickerOpen : undefined} aria-label={isMe ? t("editProfileLabel", { name: member.display_name }) : t("seatLabel", { name: member.display_name, role: member.role, mode: participationLabel, connection: connectionLabel, canReact: "yes" })}>
      <span className="player-avatar">{member.avatar_key}<i className={online ? "online" : "offline"} /></span>
      <span className="player-meta"><strong>{member.display_name}{isMe && <small> {t("you")}</small>}</strong><em>{member.role === "host" && <Crown size={11} />}{member.role === "host" ? t("organizer") : connectionLabel}</em></span>
      <span className={`participation-badge ${participationMode}`}>{participationMode === "observer" && <Eye size={12} />}{participationLabel}</span>
      {participationMode === "observer" && <span className="observer-card"><Eye size={16} />{t("observer")}</span>}
      {participationMode === "voter" && voted && <span className={`vote-card ${revealed ? "revealed" : ""}`}>{revealed ? vote?.value ?? "—" : "✦"}</span>}
    </button>
    {!isMe && pickerOpen && <EmojiPicker targetName={member.display_name} onSelect={onReact} onClose={closePicker} />}
  </div>;
}
