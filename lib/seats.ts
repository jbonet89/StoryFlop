import type { Member } from "./types";

export interface SeatPosition { xPercent: number; yPercent: number; angle: number }

const SPECIAL_POSITIONS: Record<number, Array<[number, number, number]>> = {
  1: [[50, 5, -90]],
  2: [[10, 50, 180], [90, 50, 0]],
  3: [[50, 5, -90], [90, 55, 0], [10, 55, 180]],
  4: [[50, 5, -90], [90, 50, 0], [50, 95, 90], [10, 50, 180]],
};

export function calculateSeatPositions(playerCount: number): SeatPosition[] {
  if (playerCount <= 0) return [];
  const explicit = SPECIAL_POSITIONS[playerCount];
  if (explicit) return explicit.map(([xPercent, yPercent, angle]) => ({ xPercent, yPercent, angle }));
  return Array.from({ length: playerCount }, (_, index) => {
    const radians = -Math.PI / 2 + (index / playerCount) * Math.PI * 2;
    return { xPercent: 50 + Math.cos(radians) * 40, yPercent: 50 + Math.sin(radians) * 45, angle: radians * 180 / Math.PI };
  });
}

export function sortMembersStable(members: Member[]) {
  return [...members].sort((a, b) => a.joined_at.localeCompare(b.joined_at) || a.id.localeCompare(b.id));
}

export function stableSeatPosition(index: number, total: number) {
  const position = calculateSeatPositions(total)[index] ?? { xPercent: 50, yPercent: 50 };
  return { x: position.xPercent, y: position.yPercent };
}
