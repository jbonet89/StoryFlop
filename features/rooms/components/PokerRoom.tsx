"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LanguageSelector } from "@/components/LanguageSelector";
import type { VoteValue } from "@/lib/constants";
import type { ParticipationMode } from "@/lib/types";
import type { ValidatedTaskDraft } from "@/lib/task-management";
import { calculateSeatPositions, sortMembersStable } from "@/lib/seats";
import { calculateVotingProgress, getEligibleRoundVotes, getMemberRoundMode } from "@/lib/participation";
import { isRecentReaction, removeReactionAnimation, resolveReaction } from "@/lib/room-state";
import { getErrorCode } from "@/lib/errors";
import type { RoomSnapshot } from "../api";
import { roomApi } from "../api";
import { usePresence, type RealtimeStatus } from "../hooks";
import { InviteButton } from "@/features/room/components/InviteButton";
import { ConnectionIndicator } from "@/features/room/components/ConnectionIndicator";
import { PlayerSeat } from "@/features/room/components/PlayerSeat";
import { VotingDeck } from "@/features/room/components/VotingDeck";
import { TaskList } from "@/features/room/components/TaskList";
import { RoundResults } from "@/features/room/components/RoundResults";
import { HostControls } from "@/features/room/components/HostControls";
import { FlyingReactions, type ReactionAnimation } from "@/features/room/components/FlyingReaction";
import { ParticipationModeToggle } from "@/features/room/components/ParticipationModeToggle";
import { RoundHistory } from "@/features/room/components/RoundHistory";
import { LinkedText } from "@/features/room/components/LinkedText";
import { TaskDetailDrawer, type TaskDetailMode } from "@/features/room/components/TaskDetailDrawer";
import { MemberProfileDialog } from "@/features/room/components/MemberProfileDialog";

export function PokerRoom({ snapshot, code, realtimeStatus }: { snapshot: RoomSnapshot; code: string; realtimeStatus: RealtimeStatus }) {
  const t = useTranslations("Room");
  const tErrors = useTranslations("Errors");
  const queryClient = useQueryClient();
  const presence = usePresence(snapshot.room.id, snapshot.me.id);
  const isHost = snapshot.me.role === "host";
  const activeRound = snapshot.rounds.find(round => round.status === "voting" || round.status === "revealed");
  const activeTask = snapshot.tasks.find(task => task.id === activeRound?.task_id) ?? snapshot.tasks.find(task => task.status === "voting" || task.status === "revealed");
  const currentVotes = snapshot.votes.filter(vote => vote.round_id === activeRound?.id);
  const currentParticipation = snapshot.participations.filter(item => item.round_id === activeRound?.id);
  const myParticipation = currentParticipation.find(item => item.member_id === snapshot.me.id);
  const myVote = currentVotes.find(vote => vote.member_id === snapshot.me.id);
  const myCurrentMode = getMemberRoundMode(snapshot.me, myParticipation);
  const votingProgress = calculateVotingProgress(currentParticipation);
  const eligibleVotes = getEligibleRoundVotes(currentVotes, currentParticipation);
  const members = useMemo(() => sortMembersStable(snapshot.members), [snapshot.members]);
  const positions = useMemo(() => calculateSeatPositions(members.length), [members.length]);
  const [toast, setToast] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(null);
  const [taskDetailMode, setTaskDetailMode] = useState<TaskDetailMode>("view");
  const [profileOpen, setProfileOpen] = useState(false);
  const [animations, setAnimations] = useState<ReactionAnimation[]>([]);
  const inspectionOpenerRef = useRef<HTMLElement | null>(null);
  const processedReactionIds = useRef(new Set(snapshot.reactions.map(reaction => reaction.id)));
  const connectionStatus = realtimeStatus === "en_directo" ? presence.status : realtimeStatus;

  useEffect(() => {
    const pending = snapshot.reactions.filter(reaction => !processedReactionIds.current.has(reaction.id) && isRecentReaction(reaction, Date.now(), 5_000));
    if (!pending.length) return;
    const nextAnimations: ReactionAnimation[] = [];
    let latestMessage = "";
    for (const reaction of pending) {
      processedReactionIds.current.add(reaction.id);
      const participants = resolveReaction(reaction, members);
      if (!participants) continue;
      latestMessage = t("reactionAnnouncement", { sender: participants.sender.display_name, emoji: reaction.emoji, target: participants.target.display_name });
      const source = document.querySelector<HTMLElement>(`[data-player-id="${reaction.sender_member_id}"]`);
      const target = document.querySelector<HTMLElement>(`[data-player-id="${reaction.target_member_id}"]`);
      if (!source || !target) continue;
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      nextAnimations.push({
        eventId: reaction.id, emoji: reaction.emoji,
        senderMemberId: reaction.sender_member_id, targetMemberId: reaction.target_member_id,
        senderName: participants.sender.display_name, targetName: participants.target.display_name,
        from: { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 },
        to: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
      });
    }
    const frame = requestAnimationFrame(() => {
      if (nextAnimations.length) setAnimations(current => [...current, ...nextAnimations].slice(-20));
      if (latestMessage) setAnnouncement(latestMessage);
    });
    return () => cancelAnimationFrame(frame);
  }, [members, snapshot.reactions, t]);

  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ["room", code], exact: true }), [code, queryClient]);
  async function action(run: () => Promise<unknown>) { try { await run(); await invalidate(); return true; } catch (cause) { if (process.env.NODE_ENV === "development") console.error(cause); setToast(tErrors(getErrorCode(cause))); return false; } }
  async function react(targetId: string, emoji: string) { try { await roomApi.sendReaction(snapshot.room.id, targetId, emoji); } catch (cause) { if (process.env.NODE_ENV === "development") console.error(cause); setToast(tErrors(getErrorCode(cause))); } }
  async function changeParticipationMode(mode: ParticipationMode) {
    if (activeRound?.status === "voting" && mode === "observer" && myVote && !confirm(t("observerVoteConfirm"))) return;
    setChangingMode(true);
    const changed = await action(() => roomApi.setParticipationMode(snapshot.room.id, mode, activeRound?.id));
    setChangingMode(false);
    if (changed) setAnnouncement(mode === "observer" ? t("nowObserver") : activeRound?.status === "voting" ? t("nowVoter") : t("nextVoter"));
  }
  function inspectTask(taskId: string, mode: TaskDetailMode = "view") {
    inspectionOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTaskDetailMode(mode);
    setInspectedTaskId(taskId);
  }
  const closeTaskDetail = useCallback(() => {
    setInspectedTaskId(null);
    requestAnimationFrame(() => inspectionOpenerRef.current?.focus());
  }, []);
  const removeAnimation = useCallback((eventId: string) => setAnimations(current => removeReactionAnimation(current, eventId)), []);
  const statusText = activeRound?.status === "voting" ? (votingProgress.hasVoters ? t("progress", { voted: votingProgress.votedCount, total: votingProgress.voterCount }) : t("noVoters")) : activeRound?.status === "revealed" ? t("cardsRevealed") : t("chooseTask");
  const inspectedTask = snapshot.tasks.find(task => task.id === inspectedTaskId);

  return <main className="room-app">
    <header className="room-header"><div className="room-title"><Link href="/" aria-label={t("home")}><ChevronLeft /></Link><Brand /><span className="header-divider" /><div className="room-context"><strong>{snapshot.room.name}</strong><small>{t("code", { code })}</small></div></div><div className="room-actions"><ConnectionIndicator status={connectionStatus} /><InviteButton /><div className="room-menu-wrap"><button className="icon-button" aria-label={t("moreOptions")} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><MoreHorizontal /></button>{menuOpen && <div className="room-menu"><LanguageSelector compact /><hr />{isHost && <><strong>{t("transferHost")}</strong>{members.filter(member => member.id !== snapshot.me.id).map(member => <button key={member.id} onClick={() => { setMenuOpen(false); void action(() => roomApi.transferHost(snapshot.room.id, member.id)); }}>{member.avatar_key} {member.display_name}</button>)}<hr /><button className="danger" onClick={() => { if (confirm(t("closeConfirm"))) void action(async () => { await roomApi.closeRoom(snapshot.room.id); location.href = "/"; }); }}>{t("closeRoom")}</button></>}{!isHost && <button onClick={() => { if (confirm(t("leaveConfirm"))) void action(async () => { await roomApi.leaveRoom(snapshot.room.id); location.href = "/"; }); }}>{t("leaveRoom")}</button>}</div>}</div></div></header>
    <div className="room-layout"><TaskList tasks={snapshot.tasks} activeTaskId={activeTask?.id} isHost={isHost} onCreate={(draft: ValidatedTaskDraft) => action(() => roomApi.createTask(snapshot.room.id, draft.title, draft.description, draft.taskUrl))} onDelete={id => { if (confirm(t("deleteTaskConfirm"))) void action(() => roomApi.deleteTask(id)); }} onStart={id => void action(() => roomApi.startRound(id))} onInspect={(task, mode) => inspectTask(task.id, mode)} onReorder={taskIds => action(() => roomApi.reorderTasks(snapshot.room.id, taskIds))} />
      <section className="table-stage"><div className="round-heading"><span>{activeRound ? t("round", { number: activeRound.round_number }) : t("tableReady")}</span><h1>{activeTask?.title ?? t("whatEstimate")}</h1>{activeTask?.description && <p><LinkedText text={activeTask.description} /></p>}</div>
        <ParticipationModeToggle preference={snapshot.me.default_participation_mode} currentMode={activeRound ? myCurrentMode : undefined} roundStatus={activeRound?.status} changing={changingMode} onChange={mode => void changeParticipationMode(mode)} />
        <div className={`poker-table player-count-${Math.min(members.length, 12)}`}><div className="felt"><div className="felt-ring"><span>{activeRound?.status === "revealed" ? t("results") : activeRound ? t("votingInProgress") : t("brand")}</span><strong>{statusText}</strong><div className="felt-dots">{members.map(member => { const participation = currentParticipation.find(item => item.member_id === member.id); const mode = getMemberRoundMode(member, participation); return <i key={member.id} className={mode === "observer" ? "observer" : participation?.has_voted ? "done" : ""} title={mode === "observer" ? t("observerDot", { name: member.display_name }) : undefined} />; })}</div></div></div>
          <div className="seat-grid">{members.slice(0, 12).map((member, index) => { const participation = currentParticipation.find(item => item.member_id === member.id); return <PlayerSeat key={member.id} member={member} position={positions[index]} compact={members.length > 8} isMe={member.id === snapshot.me.id} online={member.id === snapshot.me.id || presence.onlineIds.has(member.id)} participationMode={getMemberRoundMode(member, participation)} roundActive={Boolean(activeRound)} voted={participation?.has_voted ?? false} vote={currentVotes.find(vote => vote.member_id === member.id)} revealed={activeRound?.status === "revealed"} onReact={emoji => void react(member.id, emoji)} onEditProfile={() => setProfileOpen(true)} />; })}</div>
        </div>
        {activeRound?.status === "revealed" && <RoundResults votes={currentVotes} participations={currentParticipation} />}
        {isHost && <HostControls task={activeTask} round={activeRound} canReveal={eligibleVotes.length > 0} onReveal={() => void action(() => roomApi.revealRound(activeRound!.id))} onRestart={() => void action(() => roomApi.restartRound(activeRound!.id))} onCancel={() => { if (confirm(t("cancelRoundConfirm"))) void action(() => roomApi.cancelRound(activeRound!.id)); }} onFinalize={value => void action(() => roomApi.finalizeTask(activeTask!.id, value))} />}
        <RoundHistory rounds={snapshot.rounds} tasks={snapshot.tasks} members={members} participations={snapshot.participations} votes={snapshot.votes} />
      </section>
    </div>
    <VotingDeck selected={myVote?.value} roundOpen={activeRound?.status === "voting"} observer={myCurrentMode === "observer"} onBecomeVoter={() => void changeParticipationMode("voter")} onVote={(value: VoteValue) => { if (activeRound?.status === "voting" && myCurrentMode === "voter") void action(() => roomApi.castVote(activeRound.id, value)); }} />
    <FlyingReactions animations={animations} onComplete={removeAnimation} />
    <span className="sr-only" aria-live="polite">{announcement}</span>
    {inspectedTask && <TaskDetailDrawer key={`${inspectedTask.id}-${taskDetailMode}`} task={inspectedTask} rounds={snapshot.rounds} participations={snapshot.participations} votes={snapshot.votes} estimateChanges={snapshot.estimateChanges} isHost={isHost} initialMode={taskDetailMode} onClose={closeTaskDetail} onSave={draft => action(() => roomApi.updateTask(inspectedTask.id, draft.title, draft.description, draft.taskUrl))} onUpdateEstimate={estimate => action(() => roomApi.updateFinalEstimate(inspectedTask.id, estimate))} />}
    {profileOpen && <MemberProfileDialog member={snapshot.me} onClose={() => setProfileOpen(false)} onSave={(displayName, avatar) => action(() => roomApi.updateMyProfile(snapshot.room.id, displayName, avatar))} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
