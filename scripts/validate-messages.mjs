import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const locales = ["es", "en", "fr", "it", "de", "pt", "ca", "eu", "ru"];
const read = locale => JSON.parse(readFileSync(`${root}/messages/${locale}.json`, "utf8"));
const flatten = (messages, prefix = "") => Object.entries(messages).flatMap(([key, value]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof value === "string" ? [[path, value]] : flatten(value, path);
}).sort(([a], [b]) => a.localeCompare(b));
const baseEntries = flatten(read("es"));
const baseKeys = baseEntries.map(([key]) => key);
const partialLocales = new Set(["fr", "it", "ru"]);
const requiredPublicPrefixes = ["Metadata.", "Brand.", "Language.", "Common.", "Home.", "LandingSeo."];
const errors = [];
for (const locale of locales) {
  const entries = flatten(read(locale));
  const keys = entries.map(([key]) => key);
  if (partialLocales.has(locale)) {
    const unknown = keys.filter(key => !baseKeys.includes(key));
    const missingPublic = baseKeys.filter(key => requiredPublicPrefixes.some(prefix => key.startsWith(prefix)) && !keys.includes(key));
    if (unknown.length) errors.push(`${locale}: contiene claves desconocidas: ${unknown.join(", ")}`);
    if (missingPublic.length) errors.push(`${locale}: faltan claves públicas: ${missingPublic.join(", ")}`);
  } else if (JSON.stringify(keys) !== JSON.stringify(baseKeys)) errors.push(`${locale}: las claves no coinciden con es`);
  for (const [key, value] of entries) if (!value.trim()) errors.push(`${locale}: ${key} está vacía`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Catálogos válidos: ${locales.length} idiomas; las páginas públicas están traducidas en todos ellos.`);
}
