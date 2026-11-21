// passport-20261121-cand-a — entry copier.
// Copies the pre-rendered passport spread (entry.png, next to this file)
// into the grader output directory. Deterministic: same input bytes in,
// same bytes out, every run. No network, no randomness, no clock use.
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

// PNG signature: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertPngMagic(bytes, label) {
  if (bytes.length < PNG_MAGIC.length || !bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    throw new Error(`${label} is not a valid PNG (bad magic bytes)`);
  }
}

// PNG IHDR chunk: width at bytes 16-19, height at bytes 20-23,
// both big-endian uint32. Returns { width, height }.
function pngDimensions(bytes) {
  if (bytes.length < 24) throw new Error("entry.png is too short for an IHDR chunk");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width === 0 || height === 0) {
    throw new Error(`entry.png has invalid dimensions ${width}x${height}`);
  }
  return { width, height };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const input = await readFile(source);
  if (input.length === 0) throw new Error("entry.png is empty");
  assertPngMagic(input, "entry.png");
  const { width, height } = pngDimensions(input);
  await copyFile(source, target);
  const output = await readFile(target);
  assertPngMagic(output, "copied entry.png");
  if (output.length !== input.length) {
    throw new Error(`copied entry.png size mismatch: ${output.length} bytes, expected ${input.length} bytes`);
  }
  if (sha256(output) !== sha256(input)) {
    throw new Error("copied entry.png does not match the source bytes");
  }
  console.log(`wrote ${target} (${width}x${height}, ${output.length}/${input.length} bytes, sha256 ${sha256(output)})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
