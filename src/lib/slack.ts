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
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

/**
 * Sign-in alert: fires once per new session (from the /api/cron/sessions job).
 * "<person> from <company> has signed in to the Digital Sales Room."
 */
export async function sendSigninAlert({
  personName,
  companyName,
  roomSlug,
  visitorEmail,
  when,
}: {
  personName: string;
  companyName: string;
  roomSlug: string;
  visitorEmail: string;
  when: Date;
}): Promise<boolean> {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:wave: *${personName} from ${companyName} has signed in to the Digital Sales Room.*`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Visitor:*\n${visitorEmail}` },
        { type: "mrkdwn", text: `*Room:*\n${roomSlug}` },
        { type: "mrkdwn", text: `*Signed in:*\n${IST(when)}` },
      ],
    },
  ];
  return postBlocks(activityWebhook(), blocks, "sendSigninAlert");
}

/**
 * Sign-out alert: fires once, after a visitor's session has gone idle past the
 * inactivity threshold. A plain "signed out" ping (paired with the sign-in),
 * with how long they were active — not a detailed summary.
 */
export async function sendSignoutAlert({
  personName,
  companyName,
  roomSlug,
  activeTimeLabel,
  when,
}: {
  personName: string;
  companyName: string;
  roomSlug: string;
  activeTimeLabel: string;
  when: Date;
}): Promise<boolean> {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:door: *${personName} from ${companyName} has signed out of the Digital Sales Room.*`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Room:*\n${roomSlug}` },
        { type: "mrkdwn", text: `*Active time:*\n${activeTimeLabel}` },
        { type: "mrkdwn", text: `*Signed out:*\n${IST(when)}` },
      ],
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
}: {
  dateLabel: string;
  lines: string[];
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
        text: `:bar_chart: *DSR sign-ins — ${dateLabel}*\n${lines.length} ${lines.length === 1 ? "person" : "people"}`,
      },
    },
    { type: "section", text: { type: "mrkdwn", text: body } },
  ];
  return postBlocks(activityWebhook(), blocks, "sendDailyDigest");
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
