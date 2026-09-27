import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync("app/layout.tsx", "utf8");
const homePage = readFileSync("app/page.tsx", "utf8");
const roomPage = readFileSync("app/sala/[code]/page.tsx", "utf8");
const adSenseScript = readFileSync("components/AdSenseScript.tsx", "utf8");
const adsTxt = readFileSync("public/ads.txt", "utf8").trim();

describe("AdSense", () => {
  it("publica la cuenta y el vendedor autorizado", () => {
    expect(layout).toContain('"google-adsense-account": "ca-pub-2657741160026304"');
    expect(adsTxt).toBe("google.com, pub-2657741160026304, DIRECT, f08c47fec0942fa0");
  });

  it("carga el script solo en la landing pública, no en las salas", () => {
    expect(homePage).toContain("<AdSenseScript />");
    expect(roomPage).not.toContain("AdSenseScript");
    expect(adSenseScript).toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  });
});
