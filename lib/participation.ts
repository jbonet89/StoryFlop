import type { Member, Participation, ParticipationMode, Vote } from "./types";

export interface VotingProgress {
  voterCount: number;
  votedCount: number;
  pendingCount: number;
  hasVoters: boolean;
}

export function isRoundVoter(participation: Participation | undefined): boolean {
  return participation?.participation_mode === "voter";
}

export function canMemberVote(participation: Participation | undefined, roundStatus: string | undefined): boolean {
  return roundStatus === "voting" && isRoundVoter(participation);
}

export function getEligibleVoters(participations: Participation[]): Participation[] {
  return participations.filter(isRoundVoter);
}

export function getPendingVoters(participations: Participation[]): Participation[] {
  return getEligibleVoters(participations).filter(participation => !participation.has_voted);
}

export function calculateVotingProgress(participations: Participation[]): VotingProgress {
  const voters = getEligibleVoters(participations);
  const votedCount = voters.filter(participation => participation.has_voted).length;
  return {
    voterCount: voters.length,
    votedCount,
    pendingCount: voters.length - votedCount,
    hasVoters: voters.length > 0,
  };
}

export function getEligibleRoundVotes(votes: Vote[], participations: Participation[]): Vote[] {
  const voterIds = new Set(getEligibleVoters(participations).map(participation => participation.member_id));
  return votes.filter(vote => voterIds.has(vote.member_id));
}

export function getMemberRoundMode(member: Member, participation: Participation | undefined): ParticipationMode {
  return participation?.participation_mode ?? member.default_participation_mode;
}
