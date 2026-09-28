import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const legalNotice = readFileSync("app/aviso-legal/page.tsx", "utf8");
const privacy = readFileSync("app/privacidad/page.tsx", "utf8");
const cookies = readFileSync("app/cookies/page.tsx", "utf8");
const landing = readFileSync("features/rooms/components/LandingPage.tsx", "utf8");

describe("páginas legales", () => {
  it("identifica al titular y ofrece un contacto de privacidad", () => {
    expect(legalNotice).toContain("Jaume Bonet Martín");
    expect(legalNotice).toContain("L’Hospitalet de Llobregat");
    expect(legalNotice).toContain("privacy.storyflop@gmail.com");
  });

  it("documenta los tratamientos y proveedores reales", () => {
    expect(privacy).toContain("Supabase");
    expect(privacy).toContain("Vercel");
    expect(privacy).toContain("Google AdSense");
    expect(privacy).toContain("14 días");
  });

  it("documenta cookies técnicas, publicidad y retirada del consentimiento", () => {
    expect(cookies).toContain("NEXT_LOCALE");
    expect(cookies).toContain("CookieSettingsButton");
    expect(landing).toContain('href="/privacidad"');
    expect(landing).toContain('href="/cookies"');
    expect(landing).toContain('href="/aviso-legal"');
  });
});
