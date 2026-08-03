import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const locales = ["es", "en", "de", "pt", "ca", "eu"];
const read = locale => JSON.parse(readFileSync(`${root}/messages/${locale}.json`, "utf8"));
const flatten = (messages, prefix = "") => Object.entries(messages).flatMap(([key, value]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof value === "string" ? [[path, value]] : flatten(value, path);
}).sort(([a], [b]) => a.localeCompare(b));
const baseEntries = flatten(read("es"));
const baseKeys = baseEntries.map(([key]) => key);
const errors = [];
for (const locale of locales) {
  const entries = flatten(read(locale));
  const keys = entries.map(([key]) => key);
  if (JSON.stringify(keys) !== JSON.stringify(baseKeys)) errors.push(`${locale}: las claves no coinciden con es`);
  for (const [key, value] of entries) if (!value.trim()) errors.push(`${locale}: ${key} está vacía`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Catálogos válidos: ${locales.length} idiomas, ${baseKeys.length} claves cada uno.`);
}
