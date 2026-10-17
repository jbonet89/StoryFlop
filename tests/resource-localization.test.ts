import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supportedLocales } from "@/i18n/config";
import { resourceAlternates, resourceHref } from "@/lib/resource-links";
import type { ResourceContent } from "@/lib/resources";

const read = (locale: string): ResourceContent => JSON.parse(readFileSync(`messages/resources/${locale}.json`, "utf8"));
const base = read("es");

describe("recursos públicos en todos los idiomas", () => {
  it.each(supportedLocales)("traduce contenido completo sin fallback en %s", locale => {
    const content = read(locale);
    expect(Object.keys(content.ui)).toEqual(Object.keys(base.ui));
    for (const key of Object.keys(base.ui) as (keyof typeof base.ui)[]) {
      expect(content.ui[key].trim(), key).not.toBe("");
      expect(content.ui[key].match(/\{\w+\}/g), key).toEqual(base.ui[key].match(/\{\w+\}/g));
    }
    expect(content.guides.map(guide => guide.slug)).toEqual(base.guides.map(guide => guide.slug));
    content.guides.forEach((guide, index) => {
      const original = base.guides[index];
      expect(guide.sections.map(section => section.id)).toEqual(original.sections.map(section => section.id));
      expect(guide.sources.map(source => source.url)).toEqual(original.sources.map(source => source.url));
      expect(guide.cases?.length).toBe(original.cases?.length);
      guide.cases?.forEach((example, i) => {
        for (const key of ["title", "before", "after", "decision"] as const) {
          expect(example[key].trim()).not.toBe("");
          if (locale !== "es" && key !== "title") expect(example[key]).not.toBe(original.cases![i][key]);
        }
      });
      guide.sections.forEach((section, sectionIndex) => {
        expect(section.paragraphs.length).toBe(original.sections[sectionIndex].paragraphs.length);
        expect(section.checklist?.length).toBe(original.sections[sectionIndex].checklist?.length);
        expect(section.title.trim()).not.toBe("");
        for (const paragraph of section.paragraphs) expect(paragraph.trim()).not.toBe("");
        if (locale !== "es") {
          expect(section.title).not.toBe(original.sections[sectionIndex].title);
          section.paragraphs.forEach((paragraph, i) => expect(paragraph).not.toBe(original.sections[sectionIndex].paragraphs[i]));
        }
      });
    });
    expect(content.templateText.split("\n").length).toBe(base.templateText.split("\n").length);
    if (locale !== "es") {
      expect(content.ui.indexTitle).not.toBe(base.ui.indexTitle);
      expect(content.templateText).not.toBe(base.templateText);
    }
  });

  it("conserva las URL españolas y publica alternancias recíprocas", () => {
    expect(resourceHref("es", "/recursos")).toBe("/recursos");
    expect(resourceHref("en", "/recursos/primera-sesion")).toBe("/en/recursos/primera-sesion");
    const alternates = resourceAlternates("/demo");
    expect(alternates).toMatchObject({ es: "/demo", en: "/en/demo", "x-default": "/demo" });
    expect(Object.keys(alternates)).toHaveLength(10);
  });
});
