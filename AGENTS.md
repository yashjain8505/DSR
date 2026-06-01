<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Multi-agent coordination

Several agents work on this repo **concurrently**. Assume another agent may be editing, committing, or pushing at the same time as you.

## Git — never clobber shared history
- **NEVER force-push or rewrite history on `main`.** No `push --force`, no `reset --hard` onto a pushed commit, no `filter-branch` / `rebase` of commits already on `origin/main`. It silently destroys other agents' in-flight work. (History was already rewritten once on 2026-06-01 to fix the commit email — do not do it again.)
- **Commit only the files *you* changed**, with a clear, scoped message. Don't sweep another agent's unrelated changes into your commit.
- **Expect concurrent commits.** If you go to commit and the tree is unexpectedly clean, another agent probably already committed your area — don't re-commit it. `git pull --rebase` before pushing.
- **Don't touch git config.** It's already correct (`Yash Jain` / `earanyash@gmail.com`, local + global).

## Changelog — log every change, collision-free
- Log each change you make to the shared Obsidian changelog at `/Users/earan/Downloads/omi.md/Omi/log/`.
- **One file per change**, named `YYYY-MM-DD-<slug>.md`. **Never edit another agent's log file** — new files only (a single shared file races). See `log/_README.md` for the entry format.
