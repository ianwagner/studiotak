type SlackField = {
  label: string;
  value: string;
};

type SlackFormNotification = {
  formName: string;
  fields: SlackField[];
};

const MAX_FIELD_LENGTH = 1_900;
const MAX_FALLBACK_TEXT_LENGTH = 3_900;

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const escapeMrkdwn = (value: string) => value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character);

/**
 * Sends a non-blocking notification to the Slack channel configured by
 * SLACK_FORM_SUBMISSIONS_WEBHOOK_URL. Incoming webhooks keep their channel
 * destination in Slack, so no channel name is stored in or exposed by the app.
 */
export async function sendSlackFormNotification({ formName, fields }: SlackFormNotification) {
  const webhookUrl = process.env.SLACK_FORM_SUBMISSIONS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("Slack form notification webhook is not configured", { formName });
    return;
  }

  const safeFields = fields.map(({ label, value }) => ({
    type: "mrkdwn" as const,
    text: `*${escapeMrkdwn(label)}*\n${escapeMrkdwn(truncate(value || "Not provided", MAX_FIELD_LENGTH))}`
  }));
  const fallbackText = truncate(
    [`New ${formName}`, ...fields.map(({ label, value }) => `${label}: ${value || "Not provided"}`)].join("\n"),
    MAX_FALLBACK_TEXT_LENGTH
  );
  const fieldSections = Array.from({ length: Math.ceil(safeFields.length / 10) }, (_, index) => ({
    type: "section",
    fields: safeFields.slice(index * 10, (index + 1) * 10)
  }));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: fallbackText,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: truncate(`New ${formName}`, 150)
            }
          },
          ...fieldSections
        ]
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });

    const responseBody = (await response.text()).slice(0, 200);
    if (!response.ok) {
      console.error("Slack rejected the form notification", {
        formName,
        status: response.status,
        response: responseBody
      });
      return;
    }

    console.info("Slack form notification sent", {
      formName,
      status: response.status,
      response: responseBody
    });
  } catch (error) {
    console.error("Unable to send Slack form notification", {
      formName,
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
