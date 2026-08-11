import { describe, expect, it } from "vitest";
import { calculateRoundStats, formatStatistic, suggestFinalEstimate } from "@/lib/statistics";
describe("calculateRoundStats", () => {
  it("calcula media y mediana", () => { const result = calculateRoundStats(["3","5","8"]); expect(result.average).toBeCloseTo(5.333); expect(result.median).toBe(5); });
  it("excluye interrogación y café", () => { const result = calculateRoundStats(["3","?","☕","5"]); expect(result.numericVotes).toEqual([3,5]); expect(result.average).toBe(4); expect(result.distribution["☕"]).toBe(1); });
  it("detecta consenso incluyendo cartas especiales", () => { expect(calculateRoundStats(["8","8"]).consensus).toBe(true); expect(calculateRoundStats(["?","?"]).consensus).toBe(true); expect(calculateRoundStats(["8","13"]).consensus).toBe(false); });
  it("gestiona una ronda sin votos", () => { expect(calculateRoundStats([])).toMatchObject({ average:null,median:null,consensus:false }); });
  it("formatea estadísticas en español sin decimales innecesarios", () => { expect(formatStatistic(8)).toBe("8"); expect(formatStatistic(8.3333)).toBe("8,33"); expect(formatStatistic(null)).toBe("No disponible"); });
});

describe("suggestFinalEstimate", () => {
  it("elige la carta más próxima a la mediana", () => {
    expect(suggestFinalEstimate(["3", "5", "8"])).toBe("5");
  });

  it("redondea hacia arriba cuando dos cartas están a la misma distancia", () => {
    expect(suggestFinalEstimate(["3", "5"])).toBe("5");
  });

  it("ignora cartas especiales y no sugiere sin votos numéricos", () => {
    expect(suggestFinalEstimate(["3", "?", "☕", "8"])).toBe("5");
    expect(suggestFinalEstimate(["?", "☕"])).toBeNull();
  });
});
