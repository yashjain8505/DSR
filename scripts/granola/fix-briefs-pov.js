#!/usr/bin/env node
/**
 * Apply reviewed customer-POV rewrites to meeting_briefs.content / next_steps.
 *
 * Reads reviewed rewrites from scripts/granola/_brief-fix/*.fixed.md. Each fixed
 * file carries a `<!-- room_id: ... -->` header (copied from the .original.md
 * the audit produced) plus `=== CONTENT ===` and `=== NEXT_STEPS ===` blocks.
 *
 * Safety:
 *   - DRY RUN by default. Pass --apply to actually write.
 *   - ONLY touches rooms that have a .fixed.md — clean rooms are never modified.
 *   - Before every write it re-reads the room's CURRENT prod content and saves a
 *     timestamped backup to _brief-fix/_backups/, so any change is reversible.
 *   - content is always updated; next_steps is updated only when the fixed file
 *     provides a non-empty NEXT_STEPS block.
 *
 * Usage:
 *   node scripts/granola/fix-briefs-pov.js          # dry run (default)
 *   node scripts/granola/fix-briefs-pov.js --apply  # write to prod
 *   node scripts/granola/fix-briefs-pov.js --restore <backup.md>  # revert one room
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local (same pattern as the other granola scripts).
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DIR = path.join(__dirname, "_brief-fix");
const BACKUP_DIR = path.join(DIR, "_backups");
const APPLY = process.argv.includes("--apply");

/** Pull room_id, content, next_steps out of a .fixed.md / backup file. */
function parseFixed(text) {
  const roomId = (text.match(/<!--\s*room_id:\s*([^\s]+)\s*-->/) || [])[1] || null;
  const contentMatch = text.match(
    /===\s*CONTENT\s*===\n([\s\S]*?)\n===\s*NEXT_STEPS\s*===/
  );
  const nextMatch = text.match(/===\s*NEXT_STEPS\s*===\n([\s\S]*)$/);
  const content = contentMatch ? contentMatch[1].trim() : null;
  const nextSteps = nextMatch ? nextMatch[1].trim() : "";
  return { roomId, content, nextSteps };
}

async function fetchBrief(roomId) {
  const { data, error } = await supabase
    .from("meeting_briefs")
    .select("room_id, content, next_steps")
    .eq("room_id", roomId)
    .single();
  if (error) throw new Error(`fetch ${roomId}: ${error.message}`);
  return data;
}

async function restore(backupPath) {
  const text = fs.readFileSync(backupPath, "utf-8");
  const { roomId, content, nextSteps } = parseFixed(text);
  if (!roomId || content === null) {
    console.error("Backup file missing room_id or CONTENT block.");
    process.exit(1);
  }
  console.log(`Restoring room ${roomId} from ${path.basename(backupPath)} ...`);
  if (!APPLY) {
    console.log("(dry run — pass --apply to actually restore)");
    return;
  }
  const { error } = await supabase
    .from("meeting_briefs")
    .update({ content, next_steps: nextSteps })
    .eq("room_id", roomId);
  if (error) {
    console.error("restore failed:", error.message);
    process.exit(1);
  }
  console.log("✅ restored.");
}

async function main() {
  const restoreIdx = process.argv.indexOf("--restore");
  if (restoreIdx !== -1) {
    const p = process.argv[restoreIdx + 1];
    if (!p) {
      console.error("--restore needs a backup file path");
      process.exit(1);
    }
    await restore(path.isAbsolute(p) ? p : path.join(BACKUP_DIR, p));
    return;
  }

  if (!fs.existsSync(DIR)) {
    console.error(`No ${DIR} — run audit-briefs-pov.js first.`);
    process.exit(1);
  }

  const fixedFiles = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".fixed.md"))
    .sort();

  if (fixedFiles.length === 0) {
    console.log("No *.fixed.md rewrites found — nothing to apply.");
    return;
  }

  console.log(
    `${APPLY ? "APPLYING" : "DRY RUN"} — ${fixedFiles.length} reviewed rewrite(s)\n`
  );
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  let ok = 0;
  let failed = 0;

  for (const file of fixedFiles) {
    const text = fs.readFileSync(path.join(DIR, file), "utf-8");
    const { roomId, content, nextSteps } = parseFixed(text);

    if (!roomId || content === null) {
      console.log(`  ⏭️  ${file}: missing room_id or CONTENT block — skipped`);
      failed++;
      continue;
    }

    let current;
    try {
      current = await fetchBrief(roomId);
    } catch (e) {
      console.log(`  ❌ ${file}: ${e.message}`);
      failed++;
      continue;
    }

    // Always back up current prod state (reversible) before any write.
    const slug = file.replace(/\.fixed\.md$/, "");
    const backupPath = path.join(BACKUP_DIR, `${slug}.${ts}.bak.md`);
    fs.writeFileSync(
      backupPath,
      `<!-- room_id: ${roomId} -->\n<!-- backed up: ${ts} -->\n\n` +
        `=== CONTENT ===\n${current.content || ""}\n\n` +
        `=== NEXT_STEPS ===\n${current.next_steps || ""}\n`
    );

    const updates = { content };
    if (nextSteps) updates.next_steps = nextSteps;

    if (!APPLY) {
      console.log(`  📝 ${slug}  (room ${roomId})`);
      console.log(`      backup -> ${path.relative(process.cwd(), backupPath)}`);
      console.log(
        `      would update: content (${content.length} chars)` +
          (nextSteps ? ` + next_steps (${nextSteps.length} chars)` : "")
      );
      ok++;
      continue;
    }

    const { error } = await supabase
      .from("meeting_briefs")
      .update(updates)
      .eq("room_id", roomId);

    if (error) {
      console.log(`  ❌ ${slug}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✅ ${slug}  (room ${roomId}) updated`);
      ok++;
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "Dry run"}: ${ok} ok, ${failed} failed/skipped`
  );
  if (!APPLY) console.log("Re-run with --apply to write these changes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
