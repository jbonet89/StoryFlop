"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Trash2, UserMinus, Users, Wifi, WifiOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Member } from "@/lib/types";
import { getOfflineRemovalCandidates } from "@/lib/members";

export function ParticipantManagementDialog({
  members,
  meId,
  isHost,
  onlineIds,
  presenceReady,
  onClose,
  onRemove,
  onRoleChange,
}: {
  members: Member[];
  meId: string;
  isHost: boolean;
  onlineIds: Set<string>;
  presenceReady: boolean;
  onClose: () => void;
  onRemove: (memberIds: string[]) => Promise<boolean>;
  onRoleChange: (memberId: string, role: "collaborator" | "participant") => Promise<boolean>;
}) {
  const t = useTranslations("ParticipantManagement");
  const [pending, setPending] = useState<string | null>(null);
  const offlineCandidates = useMemo(() => getOfflineRemovalCandidates(members, meId, onlineIds), [meId, members, onlineIds]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape" && !pending) onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, pending]);

  async function remove(member: Member) {
    if (!confirm(t("removeConfirm", { name: member.display_name }))) return;
    setPending(member.id);
    try { await onRemove([member.id]); } finally { setPending(null); }
  }

  async function removeDisconnected() {
    if (!offlineCandidates.length) return;
    const names = offlineCandidates.map(member => member.display_name).join(", ");
    if (!confirm(t("removeDisconnectedConfirm", { count: offlineCandidates.length, names }))) return;
    setPending("bulk");
    try { await onRemove(offlineCandidates.map(member => member.id)); } finally { setPending(null); }
  }

  async function changeRole(member: Member, role: "collaborator" | "participant") {
    if (member.role === role) return;
    setPending(member.id);
    try { await onRoleChange(member.id, role); } finally { setPending(null); }
  }

  return <div className="profile-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <section className="profile-dialog participant-dialog" role="dialog" aria-modal="true" aria-labelledby="participant-dialog-title">
      <header><div><span><Users size={22} /></span><div><small>{t("eyebrow")}</small><h2 id="participant-dialog-title">{t("title")}</h2></div></div><button type="button" className="icon-button" aria-label={t("close")} onClick={onClose} disabled={Boolean(pending)}><X size={18} /></button></header>
      <div className="participant-dialog-body">
        <div className="participant-bulk-action">
          <div><strong>{t("removeDisconnected")}</strong><small>{presenceReady ? t("offlineCount", { count: offlineCandidates.length }) : t("waitingPresence")}</small></div>
          <button type="button" className="danger-button" disabled={!presenceReady || !offlineCandidates.length || Boolean(pending)} onClick={() => void removeDisconnected()}><Trash2 size={15} />{t("removeAll")}</button>
        </div>
        <ul className="participant-management-list">
          {members.map(member => {
            const online = member.id === meId || onlineIds.has(member.id);
            const removable = member.id !== meId && member.role !== "host";
            return <li key={member.id}>
              <span className="participant-avatar">{member.avatar_key}</span>
              <div className="participant-identity"><strong>{member.display_name}{member.id === meId && <small> {t("you")}</small>}</strong><span className={online ? "online" : "offline"}>{online ? <Wifi size={12} /> : <WifiOff size={12} />}{online ? t("connected") : t("disconnected")}</span></div>
              <div className="participant-role">
                {isHost && member.role !== "host" ? <select aria-label={t("roleLabel", { name: member.display_name })} value={member.role} disabled={pending === member.id} onChange={event => void changeRole(member, event.target.value as "collaborator" | "participant")}><option value="participant">{t("participant")}</option><option value="collaborator">{t("collaborator")}</option></select> : <span className={`role-chip ${member.role}`}>{member.role === "host" || member.role === "collaborator" ? <ShieldCheck size={12} /> : null}{t(member.role)}</span>}
              </div>
              {removable ? <button type="button" className="icon-button participant-remove" aria-label={t("removeLabel", { name: member.display_name })} disabled={Boolean(pending)} onClick={() => void remove(member)}><UserMinus size={16} /></button> : <span className="participant-remove-placeholder" />}
            </li>;
          })}
        </ul>
      </div>
    </section>
  </div>;
}
