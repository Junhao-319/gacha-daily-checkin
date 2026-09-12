import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(projectRoot, "public");
mkdirSync(publicDir, { recursive: true });

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function roundedRectSdf(x, y, width, height, radius) {
  const dx = Math.abs(x - width / 2) - (width / 2 - radius);
  const dy = Math.abs(y - height / 2) - (height / 2 - radius);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - radius;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function renderIcon(size, maskable = false) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const backgroundAlpha = maskable
        ? 1
        : clamp(0.5 - roundedRectSdf(nx, ny, 1, 1, 0.225) * size);
      const gradient = clamp((nx * 0.55 + ny * 0.45));
      const glow = clamp(1 - Math.hypot(nx - 0.23, ny - 0.16) * 1.8) * 0.18;
      const from = [14, 165, 233];
      const to = [99, 102, 241];
      let red = from[0] + (to[0] - from[0]) * gradient + glow * 45;
      let green = from[1] + (to[1] - from[1]) * gradient + glow * 40;
      let blue = from[2] + (to[2] - from[2]) * gradient + glow * 20;

      const strokeHalf = size * (maskable ? 0.06 : 0.065);
      const checkDistance = Math.min(
        distanceToSegment(nx * size, ny * size, 0.25 * size, 0.52 * size, 0.43 * size, 0.69 * size),
        distanceToSegment(nx * size, ny * size, 0.43 * size, 0.69 * size, 0.77 * size, 0.33 * size)
      );
      const checkAlpha = clamp(strokeHalf - checkDistance + 0.75);

      if (checkAlpha > 0) {
        red = red * (1 - checkAlpha) + 255 * checkAlpha;
        green = green * (1 - checkAlpha) + 255 * checkAlpha;
        blue = blue * (1 - checkAlpha) + 255 * checkAlpha;
      }

      const index = (y * size + x) * 4;
      pixels[index] = Math.round(clamp(red, 0, 255));
      pixels[index + 1] = Math.round(clamp(green, 0, 255));
      pixels[index + 2] = Math.round(clamp(blue, 0, 255));
      pixels[index + 3] = Math.round(backgroundAlpha * 255);
    }
  }

  return pixels;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function createPng(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let row = 0; row < size; row += 1) {
    raw[row * (stride + 1)] = 0;
    pixels.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride);
  }

  return Buffer.concat([
    signature,
    createChunk("IHDR", header),
    createChunk("IDAT", deflateSync(raw, { level: 9 })),
    createChunk("IEND", Buffer.alloc(0))
  ]);
}

const icons = [
  { filename: "pwa-192x192.png", size: 192, maskable: false },
  { filename: "pwa-512x512.png", size: 512, maskable: false },
  { filename: "maskable-512x512.png", size: 512, maskable: true },
  { filename: "apple-touch-icon.png", size: 180, maskable: true }
];

function createIco(size, pixels) {
  const png = createPng(size, pixels);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = size >= 256 ? 0 : size;
  header[7] = size >= 256 ? 0 : size;
  header[8] = 0;
  header[9] = 0;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

for (const icon of icons) {
  const pixels = renderIcon(icon.size, icon.maskable);
  writeFileSync(join(publicDir, icon.filename), createPng(icon.size, pixels));
  console.log(`Generated ${icon.filename}`);
}

const iconPixels = renderIcon(256, true);
writeFileSync(join(publicDir, "app.ico"), createIco(256, iconPixels));
console.log("Generated app.ico");