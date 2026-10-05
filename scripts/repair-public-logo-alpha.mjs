import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const logoPath = path.join(
  process.cwd(),
  "public/images/brand/logo-altana-public.png",
);

const BLACK_THRESHOLD = 28;

const { data, info } = await sharp(logoPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
    data[i + 3] = 0;
  }
}

const output = await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png({ compressionLevel: 9 })
  .toBuffer();

const tempPath = `${logoPath}.tmp`;
fs.writeFileSync(tempPath, output);
fs.renameSync(tempPath, logoPath);

const magic = output.subarray(0, 4).toString("hex");
console.log(
  JSON.stringify({
    magic,
    bytes: output.length,
    width: info.width,
    height: info.height,
  }),
);
