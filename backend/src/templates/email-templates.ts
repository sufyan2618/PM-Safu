import { env } from "../config/env";

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#2563EB;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">${env.BREVO_SENDER_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">${bodyHtml}</td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;">
                This is an automated message from ${env.BREVO_SENDER_NAME}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:16px;">${label}</a>`;
}

export function companyReceivedTemplate(companyName: string): string {
  return layout(
    "Application received",
    `<h2 style="margin-top:0;">Application received</h2>
     <p>Hi <strong>${companyName}</strong>,</p>
     <p>Thank you for registering. Your application is now under review by our team. You'll receive another email once it has been approved and you can log in.</p>`,
  );
}

export function companyApprovedTemplate(companyName: string): string {
  const loginUrl = `${env.CLIENT_BASE_URL}/login`;
  return layout(
    "Your company has been approved",
    `<h2 style="margin-top:0;">You're approved! 🎉</h2>
     <p>Hi <strong>${companyName}</strong>,</p>
     <p>Your company registration has been approved. You can now log in and complete your company setup.</p>
     ${button(loginUrl, "Log in to your account")}`,
  );
}

export function companyRejectedTemplate(companyName: string, reason: string): string {
  return layout(
    "Registration update",
    `<h2 style="margin-top:0;">Registration not approved</h2>
     <p>Hi <strong>${companyName}</strong>,</p>
     <p>Unfortunately, your company registration could not be approved at this time.</p>
     <p style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:4px;"><strong>Reason:</strong> ${reason}</p>
     <p>If you believe this is a mistake, please reach out to our support team.</p>`,
  );
}

export function userInviteTemplate(name: string, companyName: string, tempPassword: string): string {
  const loginUrl = `${env.CLIENT_BASE_URL}/login`;
  return layout(
    "You've been invited",
    `<h2 style="margin-top:0;">Welcome aboard, ${name}!</h2>
     <p>An account has been created for you at <strong>${companyName}</strong>.</p>
     <p>Use the temporary password below to log in, then change it from your profile:</p>
     <p style="font-size:20px;font-weight:700;letter-spacing:1px;background:#f3f4f6;padding:12px 16px;border-radius:8px;text-align:center;">${tempPassword}</p>
     ${button(loginUrl, "Log in")}`,
  );
}

export function passwordResetTemplate(name: string, token: string, email: string): string {
  const resetUrl = `${env.CLIENT_BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  return layout(
    "Reset your password",
    `<h2 style="margin-top:0;">Password reset request</h2>
     <p>Hi ${name},</p>
     <p>We received a request to reset your password. This link expires in 1 hour.</p>
     ${button(resetUrl, "Reset password")}
     <p style="color:#6b7280;font-size:13px;margin-top:16px;">If you didn't request this, you can safely ignore this email.</p>`,
  );
}

export function invoiceToClientTemplate(input: {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  shareUrl: string;
}): string {
  return layout(
    `Invoice ${input.invoiceNumber}`,
    `<h2 style="margin-top:0;">Invoice ${input.invoiceNumber}</h2>
     <p>Hi ${input.clientName},</p>
     <p><strong>${input.companyName}</strong> has sent you an invoice for <strong>${input.amount}</strong>, due on <strong>${input.dueDate}</strong>.</p>
     ${button(input.shareUrl, "View invoice")}`,
  );
}

export function paymentReminderTemplate(input: {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate: string;
  shareUrl: string;
}): string {
  return layout(
    `Payment reminder — ${input.invoiceNumber}`,
    `<h2 style="margin-top:0;">Payment reminder</h2>
     <p>Hi ${input.clientName},</p>
     <p>This is a friendly reminder that invoice <strong>${input.invoiceNumber}</strong> from <strong>${input.companyName}</strong> with an outstanding balance of <strong>${input.amountDue}</strong> was due on <strong>${input.dueDate}</strong>.</p>
     ${button(input.shareUrl, "View & pay invoice")}`,
  );
}
