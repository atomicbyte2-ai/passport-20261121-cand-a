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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const input = await readFile(source);
  if (input.length === 0) throw new Error("entry.png is empty");
  await copyFile(source, target);
  const output = await readFile(target);
  if (output.length !== input.length || sha256(output) !== sha256(input)) {
    throw new Error("copied entry.png does not match the source bytes");
  }
  console.log(`wrote ${target} (${output.length} bytes, sha256 ${sha256(output)})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
