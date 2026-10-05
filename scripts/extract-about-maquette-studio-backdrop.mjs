/**
 * Removes ONLY edge-connected neutral studio backdrop (~252,252,252) from the
 * About hero JPG. Architectural whites stay opaque (not treated as backdrop).
 *
 * Usage (manual, optional):
 *   node scripts/extract-about-maquette-studio-backdrop.mjs [input.jpg] [output.png]
 *
 * Default input: public/images/about/about-house-hero.jpg
 * Default output: public/images/about/about-house-hero.png
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputPath =
  process.argv[2] ??
  path.join(process.cwd(), "public/images/about/about-house-hero.jpg");
const outputPath =
  process.argv[3] ??
  path.join(process.cwd(), "public/images/about/about-house-hero.png");

if (!fs.existsSync(inputPath)) {
  throw new Error(`Input not found: ${inputPath}`);
}

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H } = info;
const out = Buffer.from(data);
const visited = new Uint8Array(W * H);

/** Studio sweep background only — not architectural white surfaces. */
function isStudioBackdrop(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > 5) return false;
  if (max < 249) return false;
  return Math.abs(r - 252) + Math.abs(g - 252) + Math.abs(b - 252) <= 5;
}

const queue = [];
for (let x = 0; x < W; x += 1) {
  queue.push([x, 0], [x, H - 1]);
}
for (let y = 1; y < H - 1; y += 1) {
  queue.push([0, y], [W - 1, y]);
}

while (queue.length > 0) {
  const [x, y] = queue.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (visited[p]) continue;
  const i = p * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (!isStudioBackdrop(r, g, b)) continue;
  visited[p] = 1;
  out[i + 3] = 0;
  queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

const png = await sharp(out, {
  raw: { width: W, height: H, channels: 4 },
})
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

await fs.promises.writeFile(outputPath, png);
console.log("written", outputPath, "bytes", png.length, `${W}x${H}`);
