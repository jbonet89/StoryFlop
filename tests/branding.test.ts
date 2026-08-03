import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import manifest from "@/app/manifest";
import { APP_NAME } from "@/lib/brand";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";
import ca from "@/messages/ca.json";
import eu from "@/messages/eu.json";

describe("marca StoryFlop", () => {
  it("mantiene el nombre sin traducir y las claves de marca en los seis idiomas", () => {
    expect(APP_NAME).toBe("StoryFlop");
    for (const catalog of [es, en, de, pt, ca, eu]) {
      expect(catalog.Metadata.appName).toBe(APP_NAME);
      expect(catalog.Brand.tagline).toBeTruthy();
      expect(catalog.Brand.claim).toBeTruthy();
      expect(catalog.Brand.shortClaim).toBeTruthy();
    }
  });

  it("publica un manifest de StoryFlop cuyos iconos existen", () => {
    expect(manifest().name).toBe(APP_NAME);
    for (const icon of manifest().icons ?? []) expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
  });

  it("mantiene un SVG fuente válido y PNG con los tamaños requeridos", async () => {
    const svgPath = join(process.cwd(), "public/brand/storyflop-mark.svg");
    expect(readFileSync(svgPath, "utf8")).toContain("<svg");
    for (const [path, size] of [["favicon-16x16.png", 16], ["favicon-32x32.png", 32], ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]] as const) {
      const metadata = await sharp(join(process.cwd(), "public/icons", path)).metadata();
      expect([metadata.width, metadata.height]).toEqual([size, size]);
    }
  });
});

