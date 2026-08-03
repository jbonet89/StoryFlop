import { describe, expect, it } from "vitest";
import { normalizeHttpUrl, parseTextWithLinks } from "@/lib/links";

describe("enlaces seguros en texto plano", () => {
  it("detecta una URL y mantiene el texto normal", () => {
    expect(parseTextWithLinks("Consulta https://example.com/doc antes de votar")).toEqual([
      { type: "text", value: "Consulta " },
      { type: "link", value: "https://example.com/doc", href: "https://example.com/doc" },
      { type: "text", value: " antes de votar" },
    ]);
  });

  it("deja la puntuación final fuera del enlace", () => {
    expect(parseTextWithLinks("Mira https://example.com/doc). Fin")).toEqual([
      { type: "text", value: "Mira " },
      { type: "link", value: "https://example.com/doc", href: "https://example.com/doc" },
      { type: "text", value: ")." },
      { type: "text", value: " Fin" },
    ]);
  });

  it("rechaza protocolos peligrosos", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("data:text/html,test")).toBeNull();
    expect(parseTextWithLinks("javascript:alert(1)")).toEqual([{ type: "text", value: "javascript:alert(1)" }]);
  });

  it("maneja texto vacío", () => expect(parseTextWithLinks("")).toEqual([]));
});
