## 2026-07-10 - linkrunner-dsr — Brief generator runs on Groq (verified)

### Changed
- `brief-from-transcript` now uses **Groq** (`GROQ_API_KEY`, OpenAI-compatible endpoint, model `llama-3.3-70b-versatile`, override with `GROQ_MODEL`) as the primary provider, with an `ANTHROPIC_API_KEY` fallback. Free tier. No OpenRouter, and no Claude subscription token (those can't authenticate direct API calls).

### Files touched
- `src/lib/brief-from-transcript.ts`

### Verified
- `npm run build` + `npm run lint` clean (0 errors).
- **End-to-end on the real TimelyBills transcript via Groq**: HTTP 200, produced a structured, customer-POV brief (Meeting Summary / Your Situation / Pain Points / What We Showed You / Questions & Answers + Next Steps), prospect-only attendee. Stored to `granola_meeting_cache.meeting_brief`.

### Notes
- `GROQ_API_KEY` is in local `.env.local` for testing. It must also be added in **Vercel → Environment Variables (Production + Preview)** and the project **redeployed** for the live site to use it.
