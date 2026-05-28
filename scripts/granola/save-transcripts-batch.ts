#!/usr/bin/env npx tsx
/**
 * Reads transcript data from stdin (JSON array) and saves to individual files.
 * Usage: cat transcripts.json | npx tsx save-transcripts-batch.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(import.meta.dirname, "transcripts");
mkdirSync(OUTPUT_DIR, { recursive: true });

let input = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const meetings = JSON.parse(input);
  const records: any[] = [];
  let saved = 0;
  let skipped = 0;

  for (const m of meetings) {
    if (!m.transcript) {
      console.log(`  ⏭️  Skipped (no transcript): ${m.title}`);
      skipped++;
      continue;
    }

    const safeTitle = m.title
      .replace(/[^a-zA-Z0-9\-_ ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);
    const dateStr = m.date.split("T")[0];
    const filename = `${dateStr}_${safeTitle}.json`;

    const record = {
      id: m.id,
      title: m.title,
      date: m.date,
      participants: m.participants,
      transcript: m.transcript,
    };

    writeFileSync(join(OUTPUT_DIR, filename), JSON.stringify(record, null, 2), "utf-8");
    records.push({
      id: m.id,
      title: m.title,
      date: m.date,
      participants: m.participants.map((p: any) => p.name).join(", "),
      transcript_length: m.transcript.length,
      filename,
    });
    saved++;
    console.log(`  ✅ ${filename}`);
  }

  // Save index
  writeFileSync(join(OUTPUT_DIR, "_index.json"), JSON.stringify(records, null, 2), "utf-8");

  // Save combined
  const allRecords = meetings
    .filter((m: any) => m.transcript)
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      participants: m.participants,
      transcript: m.transcript,
    }));
  writeFileSync(join(OUTPUT_DIR, "_all_transcripts.json"), JSON.stringify(allRecords, null, 2), "utf-8");

  console.log(`\n✅ Done! Saved ${saved}, skipped ${skipped}`);
  console.log(`   📁 ${OUTPUT_DIR}`);
  console.log(`   📄 _index.json`);
  console.log(`   📦 _all_transcripts.json`);
});
