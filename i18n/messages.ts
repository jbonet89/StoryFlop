export type MessageTree = { [key: string]: string | MessageTree };

export function flattenMessageKeys(messages: MessageTree, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenMessageKeys(value, path);
  }).sort();
}

export function mergeMessages(fallback: MessageTree, localized: MessageTree): MessageTree {
  const merged: MessageTree = { ...fallback };
  for (const [key, value] of Object.entries(localized)) {
    const fallbackValue = fallback[key];
    merged[key] = typeof value === "object" && typeof fallbackValue === "object"
      ? mergeMessages(fallbackValue, value)
      : value;
  }
  return merged;
}

export function validateMessageCatalogs(base: MessageTree, catalogs: Record<string, MessageTree>): string[] {
  const baseKeys = flattenMessageKeys(base);
  const errors: string[] = [];
  for (const [locale, catalog] of Object.entries(catalogs)) {
    const keys = flattenMessageKeys(catalog);
    if (JSON.stringify(keys) !== JSON.stringify(baseKeys)) errors.push(`${locale}: message keys do not match the base catalog`);
    for (const key of keys) {
      const value = key.split(".").reduce<string | MessageTree | undefined>((current, segment) => typeof current === "object" ? current[segment] : undefined, catalog);
      if (typeof value !== "string" || !value.trim()) errors.push(`${locale}: ${key} is empty`);
    }
  }
  return errors;
}
