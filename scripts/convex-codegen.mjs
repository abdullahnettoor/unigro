import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    if (key !== "CONVEX_DEPLOYMENT") continue;

    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env.CONVEX_DEPLOYMENT) {
      process.env.CONVEX_DEPLOYMENT = value;
    }
  }
}

if (!process.env.CONVEX_DEPLOYMENT) {
  loadEnvLocal();
}

if (!process.env.CONVEX_DEPLOYMENT) {
  console.error(
    "[convex-codegen] Missing CONVEX_DEPLOYMENT. Set it in Cloudflare Pages environment variables " +
      "or add it to .env.local for local builds."
  );
  process.exit(1);
}

const result = spawnSync("npx", ["convex", "codegen"], { stdio: "inherit" });
process.exit(result.status ?? 1);
