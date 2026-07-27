import { NextResponse, after } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { findRoomByQuery, buildRoomPrep } from "@/lib/call-prep";
import { buildRoomPrepBlocks, postToResponseUrl } from "@/lib/slack";

export const maxDuration = 30;

/**
 * POST /api/slack/prep — Slack slash command "/prep <company>".
 *
 * On-demand call prep: a rep types `/prep PayMe India` in Slack and gets back
 * who from that company did what in the DSR room. No calendar needed.
 *
 * Slash commands must be answered within 3s, so this verifies the request,
 * acks immediately, then does the DB work and posts the result to the command's
 * response_url via after() (runs after the response is sent).
 */

/** Verify the Slack request signature over the raw body (v0 HMAC-SHA256). */
function verifySlack(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;
  // Reject stale requests (>5 min) to blunt replay attacks.
  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = "v0=" + createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const signature = request.headers.get("x-slack-signature") ?? "";

  if (!verifySlack(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const query = (params.get("text") ?? "").trim();
  const responseUrl = params.get("response_url") ?? "";

  if (!query) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Usage: `/prep <company>` — e.g. `/prep PayMe India`",
    });
  }
  if (!responseUrl) {
    return NextResponse.json({ response_type: "ephemeral", text: "Missing response_url." });
  }

  // Do the lookup after acking, then post the result to response_url.
  after(async () => {
    try {
      const admin = createAdminClient();
      const { match, candidates } = await findRoomByQuery(admin, query);

      if (!match) {
        const text =
          candidates.length > 1
            ? `Found several rooms for "${query}": ${candidates.map((c) => `*${c.company_name}* (\`${c.slug}\`)`).join(", ")}. Try \`/prep <slug>\`.`
            : `No DSR room found for "${query}".`;
        await postToResponseUrl(responseUrl, [{ type: "section", text: { type: "mrkdwn", text } }], false);
        return;
      }

      const prep = await buildRoomPrep(admin, match);
      await postToResponseUrl(responseUrl, buildRoomPrepBlocks(prep), true);
    } catch (err) {
      await postToResponseUrl(
        responseUrl,
        [{ type: "section", text: { type: "mrkdwn", text: `Prep failed: ${err instanceof Error ? err.message : "error"}` } }],
        false
      );
    }
  });

  // Immediate ack (only the requester sees this) — the full prep follows.
  return NextResponse.json({
    response_type: "ephemeral",
    text: `:hourglass_flowing_sand: Pulling prep for *${query}*…`,
  });
}
