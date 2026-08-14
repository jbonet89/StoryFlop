import type { VoteValue } from "./constants";

export type RoomStatus = "open" | "closed";
export type TaskStatus = "pending" | "voting" | "revealed" | "completed";
export type RoundStatus = "voting" | "revealed" | "closed" | "cancelled";
export type ParticipationMode = "voter" | "observer";
export interface Room { id: string; code: string; name: string; owner_user_id: string; status: RoomStatus; deck: VoteValue[]; created_at: string }
export interface Member { id: string; room_id: string; user_id: string; display_name: string; avatar_key: string; role: "host" | "participant"; default_participation_mode: ParticipationMode; joined_at: string; is_kicked: boolean }
export interface PokerTask { id: string; room_id: string; title: string; description: string | null; task_url: string | null; sort_order: number; status: TaskStatus; final_estimate: string | null; finalized_from_round_id: string | null; final_estimate_updated_at: string | null; final_estimate_updated_by: string | null; created_at: string; updated_at: string }
export interface Round { id: string; room_id: string; task_id: string; round_number: number; status: RoundStatus; revealed_at: string | null; created_at: string }
export interface Vote { id: string; room_id: string; round_id: string; member_id: string; value: VoteValue; created_at: string; updated_at: string }
export interface Participation { room_id: string; round_id: string; member_id: string; participation_mode: ParticipationMode; has_voted: boolean; voted_at: string | null; created_at: string; updated_at: string }
export interface Reaction { id: string; room_id: string; sender_member_id: string; target_member_id: string; emoji: string; scale?: number; created_at: string }
export interface TaskEstimateChange { id: string; room_id: string; task_id: string; previous_estimate: string | null; new_estimate: string; changed_by: string | null; changed_by_name: string; changed_at: string }
