/**
 * One-off: verify the ideation pipeline runs end-to-end with the configured
 * Claude credential (ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY) on the default
 * model. Loads .env.local like the other scripts. Never prints secrets.
 *
 * Usage (from repo root): npx tsx scripts/ideation/verify-run.ts [prospectId]
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";

// Load .env.local (same parser as seed-plays.js; existing shell env wins).
// NOTE: pipeline.ts captures provider/model from process.env at module-load, so
// it's imported dynamically in main() — after this loader runs. (The real app
// loads env before any module evaluates, so it has no such ordering issue.)
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    if (!process.env[k]) process.env[k] = t.slice(i + 1);
  }
}

function ideasOf(
  matched: unknown,
  wildCards: unknown,
): { idea: string; why: string }[] {
  const out: { idea: string; why: string }[] = [];
  const push = (arr: unknown, whyKey: string) => {
    const a = arr as Array<Record<string, unknown>> | undefined;
    for (const x of a ?? []) {
      const idea = (x.idea ?? x.play) as string | undefined;
      if (idea) out.push({ idea, why: (x[whyKey] as string) ?? "" });
    }
  };
  const m = matched as Record<string, unknown> | unknown[] | null;
  if (Array.isArray(m)) push(m, "why_now");
  else {
    const rec = (m ?? {}) as Record<string, unknown>;
    push(rec.plays, "why_now");
    push(rec.timeline, "why");
  }
  push(wildCards, "built_on");
  return out;
}

async function main() {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasToken = !!process.env.ANTHROPIC_AUTH_TOKEN;
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const model = hasOpenRouter
    ? (process.env.ENGINE_MODEL ?? "anthropic/claude-haiku-4.5")
    : (process.env.ENGINE_MODEL ??
      process.env.ANTHROPIC_MODEL ??
      "claude-haiku-4-5");

  console.log(
    `Auth:  ${
      hasOpenRouter
        ? "OPENROUTER_API_KEY (OpenRouter)"
        : hasToken
          ? "ANTHROPIC_AUTH_TOKEN (subscription OAuth)"
          : hasKey
            ? "ANTHROPIC_API_KEY"
            : "NONE — set one in .env.local"
    }`,
  );
  console.log(`Model: ${model}`);
  if (!hasOpenRouter && !hasToken && !hasKey) {
    console.error("No LLM credential found — aborting before any API call.");
    process.exit(1);
  }

  const admin = createAdminClient();
  let prospectId = Number(process.argv[2]);
  if (!prospectId) {
    const { data, error } = await admin
      .from("prospects")
      .select("id, company")
      .ilike("company", "%godigit%")
      .order("id")
      .limit(1);
    if (error) throw new Error(`prospects lookup: ${error.message}`);
    if (!data?.length)
      throw new Error("No GoDigit prospect found; pass a prospect id as an arg.");
    prospectId = data[0].id as number;
    console.log(`Prospect: #${prospectId} ${data[0].company}`);
  }

  // Imported now (not at top) so pipeline.ts reads env after .env.local loaded.
  const { runIdeation } = await import("@/lib/ideation/pipeline");
  const t0 = Date.now();
  const result = await runIdeation(prospectId);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const matched = result.matched as Record<string, unknown> | unknown[];
  const matchedCount = Array.isArray(matched)
    ? matched.length
    : ((matched?.["plays"] as unknown[])?.length ??
      (matched?.["timeline"] as unknown[])?.length ??
      0);
  const wild = (result.wild_cards as unknown[])?.length ?? 0;

  console.log(
    `\n✅ Run ${result.runId} completed in ${secs}s — mode=${result.signals?.mode}, matched=${matchedCount}, wild_cards=${wild}`,
  );

  const ideas = ideasOf(result.matched, result.wild_cards);
  console.log(`\n--- ideas (${ideas.length}) ---`);
  for (const it of ideas) {
    console.log(`• ${it.idea}`);
    if (it.why) console.log(`    why: ${it.why}`);
  }
}

main().catch((e) => {
  console.error(`\n❌ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
