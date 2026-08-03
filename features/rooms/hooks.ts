"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Member, Participation, Reaction, Vote } from "@/lib/types";
import { mergeReaction, removeMember, removeParticipation, removeVote, upsertMember, upsertParticipation, upsertVote } from "@/lib/room-state";
import { fetchRoom, type RoomSnapshot } from "./api";

export type RealtimeStatus = "conectando" | "en_directo" | "reconectando" | "sin_conexion" | "error";

function debugStatus(channel: string, status: string) {
  if (process.env.NODE_ENV === "development") console.debug(`[realtime:${channel}]`, status);
}

export function useRoom(code: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["room", code] as const, [code]);
  const query = useQuery({ queryKey, queryFn: () => fetchRoom(code), refetchOnWindowFocus: true });
  const roomId = query.data?.room.id;
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("conectando");

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    const supabase = createClient();
    const updateSnapshot = (updater: (current: RoomSnapshot) => RoomSnapshot) => {
      if (!active) return;
      queryClient.setQueryData<RoomSnapshot | null>(queryKey, current => current ? updater(current) : current);
    };
    const handleMember = (payload: RealtimePostgresChangesPayload<Member>) => {
      if (payload.eventType === "DELETE") updateSnapshot(current => ({ ...current, members: removeMember(current.members, (payload.old as Member).id) }));
      else updateSnapshot(current => {
        const incoming = payload.new as Member;
        return { ...current, members: upsertMember(current.members, incoming), me: current.me.id === incoming.id ? incoming : current.me };
      });
    };
    const handleParticipation = (payload: RealtimePostgresChangesPayload<Participation>) => {
      if (payload.eventType === "DELETE") updateSnapshot(current => ({ ...current, participations: removeParticipation(current.participations, payload.old as Participation) }));
      else updateSnapshot(current => ({ ...current, participations: upsertParticipation(current.participations, payload.new as Participation) }));
    };
    const handleVote = (payload: RealtimePostgresChangesPayload<Vote>) => {
      if (payload.eventType === "DELETE") updateSnapshot(current => ({ ...current, votes: removeVote(current.votes, payload.old as Vote) }));
      else updateSnapshot(current => ({ ...current, votes: upsertVote(current.votes, payload.new as Vote) }));
    };
    const handleReaction = (payload: RealtimePostgresChangesPayload<Reaction>) => {
      if (payload.eventType !== "INSERT") return;
      updateSnapshot(current => ({ ...current, reactions: mergeReaction(current.reactions, payload.new as Reaction) }));
    };
    const refreshRoom = () => { if (active) void queryClient.invalidateQueries({ queryKey, exact: true }); };

    const channel = supabase.channel(`room-data:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, handleMember)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "round_participation", filter: `room_id=eq.${roomId}` }, handleParticipation)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` }, handleVote)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_estimate_changes", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions", filter: `room_id=eq.${roomId}` }, handleReaction)
      .subscribe((status: string) => {
        debugStatus(`room-data:${roomId}`, status);
        if (!active) return;
        if (status === "SUBSCRIBED") { setRealtimeStatus("en_directo"); refreshRoom(); }
        else if (status === "TIMED_OUT") setRealtimeStatus("reconectando");
        else if (status === "CHANNEL_ERROR") setRealtimeStatus("error");
        else if (status === "CLOSED") setRealtimeStatus("sin_conexion");
      });

    return () => { active = false; void supabase.removeChannel(channel); };
  }, [queryClient, queryKey, roomId]);

  return { ...query, realtimeStatus };
}

export function usePresence(roomId: string | undefined, memberId: string | undefined) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<RealtimeStatus>("conectando");
  useEffect(() => {
    if (!roomId || !memberId) return;
    let active = true;
    const supabase = createClient();
    const channelName = `presence:${roomId}`;
    const channel = supabase.channel(channelName, { config: { presence: { key: memberId } } });
    const syncPresence = () => { if (active) setOnlineIds(new Set(Object.keys(channel.presenceState()))); };
    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (state: string) => {
        debugStatus(channelName, state);
        if (!active) return;
        if (state === "SUBSCRIBED") { setStatus("en_directo"); await channel.track({ member_id: memberId, online_at: new Date().toISOString() }); }
        else if (state === "TIMED_OUT") setStatus("reconectando");
        else if (state === "CHANNEL_ERROR") setStatus("error");
        else if (state === "CLOSED") setStatus("sin_conexion");
      });
    return () => { active = false; void channel.untrack(); void supabase.removeChannel(channel); };
  }, [memberId, roomId]);
  return useMemo(() => ({ onlineIds, status }), [onlineIds, status]);
}
