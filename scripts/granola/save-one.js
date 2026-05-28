// Usage: echo '{"id":"...","title":"...","date":"...","participants":[...],"transcript":"..."}' | node save-one.js
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "transcripts");
fs.mkdirSync(dir, { recursive: true });

let input = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const m = JSON.parse(input);
  if (!m.transcript) { console.log("No transcript, skipping"); process.exit(0); }
  const safe = m.title.replace(/[^a-zA-Z0-9\-_ ]/g, "").replace(/\s+/g, "_").slice(0, 80);
  const dateStr = m.date.split("T")[0];
  const fn = `${dateStr}_${safe}.json`;
  fs.writeFileSync(path.join(dir, fn), JSON.stringify(m, null, 2));
  console.log(`Saved: ${fn}`);

  // Update index
  const idxPath = path.join(dir, "_index.json");
  const idx = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, "utf-8")) : [];
  if (!idx.find(e => e.id === m.id)) {
    idx.push({ id: m.id, title: m.title, date: m.date, participants: m.participants.map(p => p.name).join(", "), transcript_length: m.transcript.length, filename: fn });
    idx.sort((a, b) => b.date.localeCompare(a.date));
    fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2));
  }
});
