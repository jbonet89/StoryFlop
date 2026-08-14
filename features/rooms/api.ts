import { createClient, ensureAnonymousSession } from "@/lib/supabase/client";
import type { Member, Participation, ParticipationMode, PokerTask, Reaction, Room, Round, TaskEstimateChange, Vote } from "@/lib/types";
import type { VoteValue } from "@/lib/constants";
import { unwrapRpcRow } from "@/lib/supabase/rpc";

async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  await ensureAnonymousSession();
  const { data, error } = await createClient().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

async function rpcRow<T>(name: string, args: Record<string, unknown>) {
  return unwrapRpcRow(await rpc<T | T[]>(name, args), name);
}

export const roomApi = {
  createRoom: (roomName: string, displayName: string, avatarKey: string) => rpcRow<{ code: string }>("create_room", { p_room_name: roomName, p_display_name: displayName, p_avatar_key: avatarKey }),
  joinRoom: (code: string, displayName: string, avatarKey: string) => rpcRow<{ room_id: string }>("join_room", { p_code: code, p_display_name: displayName, p_avatar_key: avatarKey }),
  updateMyProfile: (roomId: string, displayName: string, avatarKey: string) => rpc("update_my_profile", { p_room_id: roomId, p_display_name: displayName, p_avatar_key: avatarKey }),
  leaveRoom: (roomId: string) => rpc("leave_room", { p_room_id: roomId }),
  transferHost: (roomId: string, memberId: string) => rpc("transfer_host", { p_room_id: roomId, p_target_member_id: memberId }),
  closeRoom: (roomId: string) => rpc("close_room", { p_room_id: roomId }),
  createTask: (roomId: string, title: string, description: string, taskUrl: string | null) => rpc("create_task", { p_room_id: roomId, p_title: title, p_description: description, p_task_url: taskUrl }),
  updateTask: (taskId: string, title: string, description: string, taskUrl: string | null) => rpc("update_task", { p_task_id: taskId, p_title: title, p_description: description, p_task_url: taskUrl }),
  deleteTask: (taskId: string) => rpc("delete_task", { p_task_id: taskId }),
  clearBacklog: (roomId: string) => rpc("clear_backlog", { p_room_id: roomId }),
  reorderTasks: (roomId: string, taskIds: string[]) => rpc("reorder_tasks", { p_room_id: roomId, p_task_ids: taskIds }),
  startRound: (taskId: string) => rpc("start_round", { p_task_id: taskId }),
  castVote: (roundId: string, value: VoteValue) => rpc("cast_vote", { p_round_id: roundId, p_value: value }),
  setParticipationMode: (roomId: string, mode: ParticipationMode, roundId?: string) => rpcRow<ParticipationModeResult>("set_my_participation_mode", { p_room_id: roomId, p_mode: mode, p_round_id: roundId ?? null }),
  revealRound: (roundId: string) => rpc("reveal_round", { p_round_id: roundId }),
  restartRound: (roundId: string) => rpc("restart_round", { p_round_id: roundId }),
  cancelRound: (roundId: string) => rpc("cancel_round", { p_round_id: roundId }),
  finalizeTask: (taskId: string, estimate: string) => rpc("finalize_task", { p_task_id: taskId, p_estimate: estimate }),
  updateFinalEstimate: (taskId: string, estimate: string) => rpc("update_final_estimate", { p_task_id: taskId, p_estimate: estimate }),
  sendReaction: (roomId: string, targetMemberId: string, emoji: string, scale = 1) => rpc("send_reaction", { p_room_id: roomId, p_target_member_id: targetMemberId, p_emoji: emoji, p_scale: scale }),
};

export interface ParticipationModeResult {
  member_id: string;
  round_id: string | null;
  default_participation_mode: ParticipationMode;
  participation_mode: ParticipationMode;
  has_voted: boolean;
  voted_at: string | null;
}

export interface RoomSnapshot { room: Room; members: Member[]; tasks: PokerTask[]; rounds: Round[]; participations: Participation[]; votes: Vote[]; reactions: Reaction[]; estimateChanges: TaskEstimateChange[]; me: Member }

export async function fetchRoom(code: string): Promise<RoomSnapshot | null> {
  await ensureAnonymousSession();
  const supabase = createClient();
  const { data: room, error } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  if (!room) return null;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const [members, tasks, rounds, participations, votes, reactions, estimateChanges] = await Promise.all([
    supabase.from("room_members").select("*").eq("room_id", room.id).eq("is_kicked", false).order("joined_at"),
    supabase.from("tasks").select("*").eq("room_id", room.id).order("sort_order"),
    supabase.from("rounds").select("*").eq("room_id", room.id).order("created_at", { ascending: false }),
    supabase.from("round_participation").select("*").eq("room_id", room.id),
    supabase.from("votes").select("*").eq("room_id", room.id),
    supabase.from("reactions").select("*").eq("room_id", room.id).gte("created_at", new Date(Date.now() - 15_000).toISOString()).order("created_at"),
    supabase.from("task_estimate_changes").select("*").eq("room_id", room.id).order("changed_at", { ascending: false }),
  ]);
  for (const result of [members, tasks, rounds, participations, votes, reactions, estimateChanges]) if (result.error) throw new Error(result.error.message);
  const memberList = members.data as Member[];
  const me = memberList.find(member => member.user_id === userId);
  if (!me) return null;
  return { room: room as Room, members: memberList, tasks: tasks.data as PokerTask[], rounds: rounds.data as Round[], participations: participations.data as Participation[], votes: votes.data as Vote[], reactions: reactions.data as Reaction[], estimateChanges: estimateChanges.data as TaskEstimateChange[], me };
}
