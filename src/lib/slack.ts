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
