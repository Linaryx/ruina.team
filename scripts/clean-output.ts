import fs from "node:fs/promises";
import path from "node:path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const rmDir = async (dir: string) => {
  await fs.rm(dir, { recursive: true, force: true });
};

const exists = async (p: string) => {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * Nuxt/Nitro writes static output to `dist/` (see `nuxt.config.ts`).
 * On Windows it's easy to get EBUSY/EPERM if Explorer/AV holds a handle.
 * This script makes `bun run build` more reliable by doing:
 * - best-effort rename to a unique temp dir
 * - best-effort delete with retries
 */
async function main() {
  const root = process.cwd();
  const outDir = path.join(root, "dist");
  const legacyOutDir = path.join(root, ".output"); // older default; keep clean optional

  const targets = [outDir, legacyOutDir];
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(
    2,
    "0",
  )}${String(now.getSeconds()).padStart(2, "0")}`;

  for (const dir of targets) {
    if (!(await exists(dir))) continue;

    // 1) Try rename first (often succeeds even if recursive delete fails).
    const tmp = `${dir}__old_${stamp}`;
    try {
      await fs.rename(dir, tmp);
      // Delete asynchronously with retries; ignore final failure.
      for (let i = 0; i < 8; i++) {
        try {
          await rmDir(tmp);
          break;
        } catch (e: any) {
          const code = String(e?.code || "");
          if (code !== "EBUSY" && code !== "EPERM") break;
          await sleep(150 * (i + 1));
        }
      }
      continue;
    } catch {
      // fall through to rm retry
    }

    // 2) Fallback: retry rm directly.
    for (let i = 0; i < 10; i++) {
      try {
        await rmDir(dir);
        break;
      } catch (e: any) {
        const code = String(e?.code || "");
        if (code !== "EBUSY" && code !== "EPERM") throw e;
        await sleep(200 * (i + 1));
      }
    }
  }
}

main().catch((err) => {
  console.error("[clean] failed:", err);
  // Don't hard-fail the pipeline; Nuxt will attempt its own cleanup too.
  process.exitCode = 0;
});
