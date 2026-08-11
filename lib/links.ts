export type TextPart =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return null;
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith("//") ? `https:${trimmed}` : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function splitTrailingPunctuation(value: string) {
  let link = value;
  let suffix = "";
  while (/[.,!?;:]$/.test(link)) {
    suffix = link.slice(-1) + suffix;
    link = link.slice(0, -1);
  }
  for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]] as const) {
    while (link.endsWith(close) && link.split(close).length > link.split(open).length) {
      suffix = close + suffix;
      link = link.slice(0, -1);
    }
  }
  return { link, suffix };
}

export function parseTextWithLinks(text: string): TextPart[] {
  if (!text) return [];
  const result: TextPart[] = [];
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) result.push({ type: "text", value: text.slice(cursor, index) });
    const { link, suffix } = splitTrailingPunctuation(match[0]);
    const href = normalizeHttpUrl(link);
    if (href) result.push({ type: "link", value: link, href });
    else result.push({ type: "text", value: link });
    if (suffix) result.push({ type: "text", value: suffix });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) result.push({ type: "text", value: text.slice(cursor) });
  return result;
}

export function getUrlDomain(value: string): string {
  try { return new URL(value).hostname.replace(/^www\./, ""); }
  catch { return value; }
}
