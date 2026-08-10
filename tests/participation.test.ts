import { describe, expect, it } from "vitest";
import {
  calculateVotingProgress,
  canRevealRound,
  canMemberVote,
  getEligibleRoundVotes,
  getMemberRoundMode,
  getPendingVoters,
} from "@/lib/participation";
import { calculateRoundStats } from "@/lib/statistics";
import type { Member, Participation, ParticipationMode, Vote } from "@/lib/types";

const now = "2026-08-03T12:00:00Z";
const participation = (member_id: string, participation_mode: ParticipationMode = "voter", has_voted = false, round_id = "round-1"): Participation => ({
  room_id: "room-1", round_id, member_id, participation_mode, has_voted,
  voted_at: has_voted ? now : null, created_at: now, updated_at: now,
});
const vote = (member_id: string, value: Vote["value"], round_id = "round-1"): Vote => ({
  id: `vote-${round_id}-${member_id}`, room_id: "room-1", round_id, member_id, value, created_at: now, updated_at: now,
});
const member = (default_participation_mode: ParticipationMode): Member => ({
  id: "member-1", room_id: "room-1", user_id: "user-1", display_name: "Ana", avatar_key: "🦊",
  role: "participant", default_participation_mode, joined_at: now, is_kicked: false,
});

describe("progreso de votación", () => {
  it("cuenta tres votos entre cuatro votantes", () => {
    const rows = [participation("a", "voter", true), participation("b", "voter", true), participation("c", "voter", true), participation("d")];
    expect(calculateVotingProgress(rows)).toEqual({ voterCount: 4, votedCount: 3, pendingCount: 1, hasVoters: true });
  });

  it("excluye observadores del total y de pendientes", () => {
    const rows = [
      participation("a", "voter", true), participation("b", "voter", true), participation("c", "voter", true), participation("d"),
      participation("e", "observer"), participation("f", "observer"),
    ];
    expect(calculateVotingProgress(rows)).toMatchObject({ voterCount: 4, votedCount: 3, pendingCount: 1 });
    expect(getPendingVoters(rows).map(row => row.member_id)).toEqual(["d"]);
  });

  it("representa una ronda sin votantes sin fabricar 0 de 0", () => {
    expect(calculateVotingProgress([participation("a", "observer"), participation("b", "observer")])).toEqual({ voterCount: 0, votedCount: 0, pendingCount: 0, hasVoters: false });
  });

  it("permite revelar a un organizador observador cuando otra persona ha votado", () => {
    const rows = [participation("host", "observer"), participation("voter", "voter", true)];
    expect(canRevealRound(rows)).toBe(true);
  });

  it("no permite revelar sin ningún voto aunque existan votantes", () => {
    expect(canRevealRound([participation("host", "observer"), participation("voter")])).toBe(false);
  });
});

describe("elegibilidad y resultados", () => {
  it("excluye incluso un voto residual de un observador", () => {
    const rows = [participation("a", "voter", true), participation("b", "observer")];
    expect(getEligibleRoundVotes([vote("a", "5"), vote("b", "34")], rows).map(item => item.member_id)).toEqual(["a"]);
  });

  it("calcula media, mediana y consenso solo con votantes y conserva ? y café", () => {
    const rows = [participation("a", "voter", true), participation("b", "voter", true), participation("c", "voter", true), participation("observer", "observer")];
    const eligible = getEligibleRoundVotes([vote("a", "3"), vote("b", "?"), vote("c", "☕"), vote("observer", "34")], rows);
    const stats = calculateRoundStats(eligible.map(item => item.value));
    expect(stats.numericVotes).toEqual([3]);
    expect(stats.average).toBe(3);
    expect(stats.median).toBe(3);
    expect(stats.distribution).toEqual({ "3": 1, "?": 1, "☕": 1 });
    expect(stats.consensus).toBe(false);
  });

  it("no genera estadísticas numéricas con cero votos elegibles", () => {
    const stats = calculateRoundStats(getEligibleRoundVotes([vote("a", "8")], [participation("a", "observer")]).map(item => item.value));
    expect(stats).toMatchObject({ average: null, median: null, consensus: false, distribution: {} });
  });
});

describe("cambios de modo e histórico", () => {
  it("un observador no puede votar y al activarse como votante queda pendiente", () => {
    expect(canMemberVote(participation("a", "observer"), "voting")).toBe(false);
    const activated = participation("a", "voter", false);
    expect(canMemberVote(activated, "voting")).toBe(true);
    expect(getPendingVoters([activated])).toEqual([activated]);
  });

  it("la preferencia nueva no sustituye el snapshot de una ronda antigua", () => {
    const changedMember = member("voter");
    expect(getMemberRoundMode(changedMember, participation(changedMember.id, "observer", false, "round-old"))).toBe("observer");
    expect(getMemberRoundMode(changedMember, undefined)).toBe("voter");
  });
});
