import type { VoteValue } from "./constants";
export interface RoundStats { average: number | null; median: number | null; consensus: boolean; distribution: Record<string, number>; numericVotes: number[] }
export function calculateRoundStats(values: VoteValue[]): RoundStats {
  const numericVotes = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const distribution = values.reduce<Record<string, number>>((result, value) => ({ ...result, [value]: (result[value] ?? 0) + 1 }), {});
  const average = numericVotes.length ? numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length : null;
  const middle = Math.floor(numericVotes.length / 2);
  const median = !numericVotes.length ? null : numericVotes.length % 2 ? numericVotes[middle] : (numericVotes[middle - 1] + numericVotes[middle]) / 2;
  return { average, median, consensus: values.length > 0 && new Set(values).size === 1, distribution, numericVotes };
}

export function formatStatistic(value: number | null, locale = "es", unavailable = "No disponible"): string {
  return value === null || !Number.isFinite(value) ? unavailable : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
