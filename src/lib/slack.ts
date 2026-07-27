/**
 * Webhook for DSR activity alerts (sign-in + session summary). Falls back to the
 * legacy SLACK_WEBHOOK_URL so the feature still posts somewhere if the dedicated
 * channel var isn't set yet.
 */
function activityWebhook(): string | null {
  return (
    process.env.SLACK_DSR_ACTIVITY_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    null
  );
}

/**
 * Slack member IDs to @mention on every activity alert (e.g. Shreyans), from
 * SLACK_MENTION_USER_IDS (comma-separated, e.g. "U0123ABCD,U0456WXYZ"). Empty
 * when unset. Slack notifies these users if they're in the channel.
 */
function mentionPrefix(): string {
  const ids = (process.env.SLACK_MENTION_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids.map((id) => `<@${id}>`).join(" ") + " " : "";
}

/** Loud [TEST] tag so manually-triggered test alerts are never mistaken for real ones. */
function prefix(test: boolean): string {
  return `${test ? ":test_tube: *[TEST]* " : ""}${mentionPrefix()}`;
}

/** POST Block Kit blocks to a webhook. Never throws; returns whether it posted. */
async function postBlocks(
  webhookUrl: string | null,
  blocks: unknown[],
  context: string
): Promise<boolean> {
  if (!webhookUrl) {
    console.warn(`${context}: no Slack webhook configured, skipping`);
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    return res.ok;
  } catch (error) {
    console.error(`${context}: Slack post failed:`, error);
    return false;
  }
}

const IST = (d: Date) =>
  d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

/**
 * Sign-in alert: fires once per new session (from the /api/cron/sessions job).
 * "<person> from <company> has signed in to the Digital Sales Room."
 */
export async function sendSigninAlert({
  personName,
  companyName,
  when,
  test = false,
}: {
  personName: string;
  companyName: string;
  when: Date;
  test?: boolean;
}): Promise<boolean> {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${prefix(test)}:wave: *${personName} from ${companyName} signed in*\n${IST(when)}`,
      },
    },
  ];
  return postBlocks(activityWebhook(), blocks, "sendSigninAlert");
}

/**
 * Sign-out alert: fires once, after a visitor's session has gone idle past the
 * inactivity threshold. Deliberately mirrors the sign-in — one line + timestamp.
 */
export async function sendSignoutAlert({
  personName,
  companyName,
  when,
  test = false,
}: {
  personName: string;
  companyName: string;
  when: Date;
  test?: boolean;
}): Promise<boolean> {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${prefix(test)}:door: *${personName} from ${companyName} signed out*\n${IST(when)}`,
      },
    },
  ];
  return postBlocks(activityWebhook(), blocks, "sendSignoutAlert");
}

/**
 * Daily digest: one message listing everyone who signed in the previous day.
 * `lines` is pre-formatted, one bullet per person.
 */
export async function sendDailyDigest({
  dateLabel,
  lines,
  test = false,
}: {
  dateLabel: string;
  lines: string[];
  test?: boolean;
}): Promise<boolean> {
  const body =
    lines.length > 0
      ? lines.join("\n")
      : "_No sign-ins yesterday._";
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${prefix(test)}:bar_chart: *DSR sign-ins — ${dateLabel}*\n${lines.length} ${lines.length === 1 ? "person" : "people"}`,
      },
    },
    { type: "section", text: { type: "mrkdwn", text: body } },
  ];
  return postBlocks(activityWebhook(), blocks, "sendDailyDigest");
}

/**
 * Pre-call prep doc: posted ~30 min before a scheduled call, summarizing what
 * the prospect did in their DSR room so the rep can skim before joining.
 */
export async function sendCallPrepDoc({
  personName,
  companyName,
  roomSlug,
  meetingTitle,
  minutesUntil,
  activeTimeLabel,
  sectionLines,
  actionLines,
  hasActivity,
  test = false,
}: {
  personName: string;
  companyName: string;
  roomSlug: string;
  meetingTitle: string;
  minutesUntil: number;
  activeTimeLabel: string;
  sectionLines: string[];
  actionLines: string[];
  hasActivity: boolean;
  test?: boolean;
}): Promise<boolean> {
  const blocks: unknown[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${prefix(test)}:calendar: *Call prep — ${personName} from ${companyName}, in ~${minutesUntil} min*\n_${meetingTitle}_`,
      },
    },
  ];

  if (hasActivity) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*In the room (${activeTimeLabel} active):*\n${sectionLines.join("\n")}`,
      },
    });
    if (actionLines.length > 0) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*What they did:*\n${actionLines.join("\n")}` },
      });
    }
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Room: ${roomSlug}` }],
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_Hasn't opened the room (${roomSlug}) yet — worth nudging them to it._`,
      },
    });
  }

  return postBlocks(activityWebhook(), blocks, "sendCallPrepDoc");
}

/**
 * Send a Slack notification via webhook.
 * Used to alert when a prospect opens a room.
 */
export async function sendSlackNotification({
  roomSlug,
  companyName,
  visitorEmail,
  visitorName,
}: {
  roomSlug: string;
  companyName: string;
  visitorEmail: string;
  visitorName?: string;
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not configured, skipping notification");
    return false;
  }

  const visitorLabel = visitorName
    ? `${visitorName} (${visitorEmail})`
    : visitorEmail;

  const message = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Someone just opened a deal room* :eyes:`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Company:*\n${companyName}`,
          },
          {
            type: "mrkdwn",
            text: `*Visitor:*\n${visitorLabel}`,
          },
          {
            type: "mrkdwn",
            text: `*Room:*\n${roomSlug}`,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return false;
  }
}
