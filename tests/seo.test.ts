import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homePage = readFileSync("app/[locale]/page.tsx", "utf8");
const roomPage = readFileSync("app/sala/[code]/page.tsx", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const structuredData = readFileSync("components/WebApplicationStructuredData.tsx", "utf8");

describe("SEO técnico", () => {
  it("publica canonical, robots y sitemap", () => {
    expect(homePage).toContain("canonical: `/${locale}`");
    expect(homePage).toContain('"x-default": "/"');
    expect(homePage).toContain("localeAlternates");
    expect(robots).toContain("/sitemap.xml");
    expect(sitemap).toContain('changeFrequency: "weekly"');
    expect(sitemap).toContain("supportedLocales.map");
    expect(sitemap).toContain("/aviso-legal");
    expect(sitemap).toContain("/privacidad");
    expect(sitemap).toContain("/cookies");
  });

  it("excluye las salas de los resultados sin impedir leer la directiva", () => {
    expect(roomPage).toContain("index: false");
    expect(roomPage).toContain("follow: false");
    expect(robots).not.toContain('disallow: "/sala/"');
  });

  it("describe la aplicación pública con datos estructurados", () => {
    expect(homePage).toContain("<WebApplicationStructuredData />");
    expect(structuredData).toContain('"@type": "WebApplication"');
    expect(structuredData).toContain('price: "0"');
  });
});
