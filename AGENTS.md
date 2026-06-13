# Linkrunner DSR — Agent Guide

Digital Sales Room: per-prospect microsites ("rooms") + an admin CMS. Next.js + Supabase, deployed on Vercel.

## Stack & commands
- Next.js 16.2.6 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind v4 (CSS-first) · npm
- Supabase (Postgres) via `@supabase/ssr` + `supabase-js` · lucide-react · sharp (image processing)
- `npm run dev` (:3000) · `npm run build` · `npm run start` · `npm run lint`
- No test suite — run `npm run build && npm run lint` before committing.
- ⚠️ Next 16 differs from training data. Check `node_modules/next/dist/docs/` before using unfamiliar or changed APIs.

## Project map
- `src/app/(admin)/admin/**` — admin CMS (rooms, assets, analytics, meetings). Cookie-gated.
- `src/app/(prospect)/room/[slug]/**` — public prospect room. CSP-locked (see `next.config.ts`).
- `src/app/api/**` — ~24 route handlers; all Supabase reads/writes go through these.
- `src/components/{admin,room,shared,ui}` — `ui/` = hand-rolled primitives (no component library).
- `src/lib/` — `supabase/` clients · `constants.ts` (tab/asset taxonomy = source of truth) ·
  `brand-colors.ts` + `palette.ts` (logo → brand color extraction) · `utils.ts` (`cn`, slug, dates) ·
  `slack.ts` (room-open notifications) · `types/` (hand-maintained).
- `supabase/migrations/` — numbered SQL, applied by hand (see Hard rules).
- `scripts/` — one-off seeders/fixers, run via `npx tsx` (.ts) or `node` (.js); they load `.env.local` themselves.
- `docs/changelog/` — shared agent changelog (see below).

## Conventions you'd get wrong
- **Three Supabase clients — pick deliberately:**
  - `lib/supabase/client.ts` — browser, anon key, RLS enforced.
  - `lib/supabase/server.ts` — Server Components / route-handler reads, anon key, RLS enforced.
  - `lib/supabase/admin.ts` (`createAdminClient`) — service-role key, **bypasses RLS**, server-only writes. Never import into client code.
  - Route-handler pattern: read with the server client, write/seed with the admin client.
- **Admin auth is an HMAC-signed session cookie (`admin_session`), not Supabase Auth.** `POST /api/auth/login` checks `ADMIN_PASSWORD` and sets the cookie; signing/verification lives in `src/lib/auth.ts`. There is no middleware. **Every new API route handler must start with `const unauthorized = await requireAdmin(); if (unauthorized) return unauthorized;`** unless intentionally public — currently only `auth/login`, `analytics`, `visitors`, and `assets/proxy` are public.
- **Route handlers** wrap logic in try/catch and return `NextResponse.json({ error }, { status })` on failure, the resource on success.
- **Styling = Tailwind v4 CSS-first.** Theme tokens are CSS vars in `globals.css` (`--lr-primary`, `--lr-bg`, …); there is no `tailwind.config.js`. Concatenate classes with `cn()` from `lib/utils.ts` (not clsx).
- **Tab/asset structure lives in `lib/constants.ts`** — extend the taxonomy there, never ad-hoc.
- Path alias `@/*` → `src/*`. `src/lib/types/` is hand-written, not generated — keep it in sync with the DB schema.

## Env vars (names only — never read or commit `.env.local`)
All declared in `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SLACK_WEBHOOK_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
`GRANOLA_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_AUTH_TOKEN`,
`OPENROUTER_API_KEY`, `ENGINE_MODEL`, `DIGEST_WEBHOOK_URL`.
New vars must also be set in the Vercel project settings or production breaks.

## Hard rules
- **Pushing `main` = production deploy.** Vercel auto-builds every push to `main` via the GitHub integration. Don't push anything you haven't built and linted locally.
- **Never force-push or rewrite pushed history on `main`** — no `push --force`, no `reset --hard` onto pushed commits, no rebase/filter-branch of anything on `origin/main`. Multiple agents work this branch concurrently; rewriting silently destroys their in-flight work.
- Commit only the files *you* changed, with a scoped message. `git pull --rebase` before pushing. Don't touch git config (`Yash Jain` / `earanyash@gmail.com` is correct).
- **Never** commit `.env*`; don't read `.env.local` values.
- **Migrations are applied by hand** in the Supabase SQL editor — there is no Supabase CLI setup, no `config.toml`, no migration runner. Never run DDL against prod from app code. Details: `supabase/CLAUDE.md`.
- `scripts/granola/{moms,transcripts,_brief-fix}/` hold sensitive meeting data and are gitignored — keep it that way.
- Log every change to the changelog (below).

## Changelog — one file per change, collision-free
- Log each change to `docs/changelog/`, one file per change, named `YYYY-MM-DD-<slug>.md`.
- **Never edit another agent's log file** — new files only (a single shared file races). Entry format: `docs/changelog/_README.md`.
