import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const artworkDirectory = join(projectRoot, "public", "game-art");
const manifestPath = join(artworkDirectory, "manifest.json");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".mp4", ".webm", ".gif"]);

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(path);
      }
      return supportedExtensions.has(entry.name.toLowerCase().slice(entry.name.lastIndexOf(".")))
        ? [path]
        : [];
    })
    .sort();
}

const files = collectFiles(artworkDirectory);
const images = {};
const versionHash = createHash("sha256");

for (const file of files) {
  const relativePath = relative(artworkDirectory, file).split(sep).join("/");
  const content = readFileSync(file);
  const hash = createHash("sha256").update(content).digest("hex");
  images[relativePath] = { sha256: hash, bytes: statSync(file).size };
  versionHash.update(relativePath).update(hash);
}

const manifest = {
  version: versionHash.digest("hex").slice(0, 16),
  images
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Updated game artwork manifest: ${manifest.version}`);