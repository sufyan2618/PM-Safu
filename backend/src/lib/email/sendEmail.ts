import { brevoConfig } from "../../config/brevo";
import { logger } from "../logger";

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends a transactional email through the Brevo HTTP API.
 * Throws on failure so the BullMQ worker can retry.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const response = await fetch(brevoConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": brevoConfig.apiKey,
    },
    body: JSON.stringify({
      sender: brevoConfig.sender,
      to: [{ email: input.to, name: input.toName }],
      subject: input.subject,
      htmlContent: input.html,
      ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Brevo email send failed", { status: response.status, body });
    throw new Error(`Failed to send email (${response.status}): ${body}`);
  }
}
