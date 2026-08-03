import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expectedPngs = {
  "public/icons/favicon-16x16.png": 16,
  "public/icons/favicon-32x32.png": 32,
  "public/icons/apple-touch-icon.png": 180,
  "public/icons/icon-192.png": 192,
  "public/icons/icon-512.png": 512,
  "public/og.png": [1200, 630],
};

for (const [relativePath, expected] of Object.entries(expectedPngs)) {
  const metadata = await sharp(join(root, relativePath)).metadata();
  const [width, height] = Array.isArray(expected) ? expected : [expected, expected];
  if (metadata.format !== "png" || metadata.width !== width || metadata.height !== height) {
    throw new Error(`${relativePath} must be a ${width}x${height} PNG`);
  }
}

const svg = await readFile(join(root, "public/brand/storyflop-mark.svg"), "utf8");
if (!svg.includes("<svg") || !svg.includes("StoryFlop") || /<script|data:|(?:href|src)=["']https?:/i.test(svg)) throw new Error("Invalid or unsafe StoryFlop SVG source");
await sharp(Buffer.from(svg)).metadata();

const ico = await readFile(join(root, "app/favicon.ico"));
if (ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) !== 3) throw new Error("app/favicon.ico must contain three icon images");
const icoSizes = [ico.readUInt8(6), ico.readUInt8(22), ico.readUInt8(38)];
if (icoSizes.join(",") !== "16,32,48") throw new Error("app/favicon.ico must contain 16, 32 and 48 pixel images");

const manifest = await readFile(join(root, "app/manifest.ts"), "utf8");
for (const relativePath of Object.keys(expectedPngs).filter(path => path.startsWith("public/icons/"))) {
  const publicPath = `/${relativePath.replace("public/", "")}`;
  if (!manifest.includes(publicPath)) throw new Error(`Manifest does not reference ${publicPath}`);
  await access(join(root, relativePath));
}

const brandConstant = await readFile(join(root, "lib/brand.ts"), "utf8");
if (!brandConstant.includes('APP_NAME = "StoryFlop"')) throw new Error("APP_NAME is not StoryFlop");

for (const locale of ["es", "en", "de", "pt", "ca", "eu"]) {
  const messages = JSON.parse(await readFile(join(root, `messages/${locale}.json`), "utf8"));
  if (messages.Metadata?.appName !== "StoryFlop" || !messages.Brand?.tagline || !messages.Brand?.claim || !messages.Brand?.shortClaim) {
    throw new Error(`Missing StoryFlop brand messages in ${locale}`);
  }
}

console.log("StoryFlop brand assets and six localized catalogs are valid.");
