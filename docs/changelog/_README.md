# Change log — one file per entry

Multiple agents work on **linkrunner-dsr** concurrently. Each logs every change here so all agents (and Yash) share a common record.

## Rules
- **One file per change.** Name it `YYYY-MM-DD-<short-slug>.md` (e.g. `2026-06-01-next-steps-action-plan.md`).
- **Never edit another agent's file.** New files only — this avoids the concurrent-write races a single shared file suffers.
- Expect new files to appear at any time; re-check the folder before assuming what others have done.

## Entry format
Each file is one entry with these sections:

- `## YYYY-MM-DD - linkrunner-dsr — <title>`
- `### Changed` — what changed (prospect / admin behavior)
- `### Files touched` — repo-relative paths
- `### Verified` — tsc / eslint / browser checks
- `### Commits` *(optional)* — `` `<sha>` — <subject> ``
- `### Notes` *(optional)* — caveats, storage decisions, ship status

## History
Entries before 2026-06-10 live in the old Obsidian location
(`/Users/earan/Downloads/omi.md/Omi/log/`). New entries go **here**, not there.
