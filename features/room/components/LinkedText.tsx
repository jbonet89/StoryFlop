import { parseTextWithLinks } from "@/lib/links";

export function LinkedText({ text }: { text: string }) {
  const parts = parseTextWithLinks(text);
  return <span className="linked-text">{parts.map((part, index) => part.type === "link"
    ? <a key={`${part.href}-${index}`} href={part.href} target="_blank" rel="noopener noreferrer">{part.value}</a>
    : <span key={index}>{part.value}</span>)}</span>;
}
