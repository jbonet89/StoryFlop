import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "public/brand/storyflop-mark.svg");
const ogSourcePath = join(root, "public/brand/storyflop-og.svg");
const iconsDirectory = join(root, "public/icons");
const source = await readFile(sourcePath);

await mkdir(iconsDirectory, { recursive: true });
await copyFile(sourcePath, join(root, "app/icon.svg"));

const targets = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

for (const [name, size] of targets) {
  await sharp(source).resize(size, size).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(iconsDirectory, name));
}

const icoImages = await Promise.all([16, 32, 48].map(size => sharp(source).resize(size, size).png({ compressionLevel: 9 }).toBuffer()));
await writeFile(join(root, "app/favicon.ico"), createIco(icoImages, [16, 32, 48]));
await sharp(await readFile(ogSourcePath)).resize(1200, 630).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(root, "public/og.png"));

console.log("StoryFlop assets generated: SVG, ICO (16/32/48), PNG (16/32/180/192/512) and Open Graph (1200x630).");

function createIco(images, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    const size = sizes[index];
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images]);
}

