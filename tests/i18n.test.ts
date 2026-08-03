import { describe, expect, it } from "vitest";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";
import ca from "@/messages/ca.json";
import eu from "@/messages/eu.json";
import { normalizeLocale, parseAcceptLanguage, resolveLocalePreference, resolveSupportedLocale } from "@/i18n/config";
import { flattenMessageKeys, mergeMessages, validateMessageCatalogs, type MessageTree } from "@/i18n/messages";
import { formatDateTime } from "@/lib/formatting";
import { formatStatistic } from "@/lib/statistics";

describe("resolución de idioma", () => {
  it.each([["es-ES","es"],["en-GB","en"],["de-AT","de"],["pt-BR","pt"],["ca-ES","ca"],["eu-ES","eu"],["fr-FR",null],["EN_us","en"]])("normaliza %s", (requested, expected) => expect(normalizeLocale(requested)).toBe(expected));
  it("respeta el primer idioma soportado y los pesos de Accept-Language", () => {
    expect(resolveSupportedLocale(["fr-FR", "de-CH", "en-US"])).toBe("de");
    expect(parseAcceptLanguage("en-US;q=0.7, de-DE;q=0.9, es;q=0.8")).toEqual(["de-DE", "es", "en-US"]);
  });
  it("da prioridad a una cookie válida e ignora una inválida", () => {
    expect(resolveLocalePreference("ca", "de-DE")).toBe("ca");
    expect(resolveLocalePreference("fr", "pt-BR")).toBe("pt");
    expect(resolveLocalePreference(undefined, "fr-FR")).toBe("es");
  });
});

describe("catálogos", () => {
  const catalogs = { es, en, de, pt, ca, eu } as unknown as Record<string, MessageTree>;
  it("mantiene las mismas claves y ningún valor vacío", () => expect(validateMessageCatalogs(es as MessageTree, catalogs)).toEqual([]));
  it("aplica fallback profundo a español", () => {
    const merged = mergeMessages({ A: { one: "uno", two: "dos" } }, { A: { one: "one" } });
    expect(merged).toEqual({ A: { one: "one", two: "dos" } });
    expect(flattenMessageKeys(es as MessageTree).length).toBeGreaterThan(200);
  });
});

describe("formato localizado", () => {
  it("mantiene el número y cambia solo su presentación", () => {
    expect(formatStatistic(8.33, "es")).toBe("8,33");
    expect(formatStatistic(8.33, "en")).toBe("8.33");
    expect(formatStatistic(8.33, "de")).toBe("8,33");
  });
  it("formatea fechas válidas y nunca muestra Invalid Date", () => {
    expect(formatDateTime("2026-08-03T16:42:00Z", "en", "N/A")).toContain("2026");
    expect(formatDateTime("not-a-date", "en", "N/A")).toBe("N/A");
  });
});
