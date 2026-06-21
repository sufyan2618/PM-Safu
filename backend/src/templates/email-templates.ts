import { env } from "../config/env";

/**
 * Brand + design tokens mirrored from the web app ("The Ledger" theme) so
 * transactional emails feel like a native extension of the product. Values are
 * hard-coded (not CSS vars) because email clients only support inline styles.
 */
const brand = {
  name: env.BREVO_SENDER_NAME,
  logoUrl: env.EMAIL_LOGO_URL ?? `${env.APP_BASE_URL}/assets/logo.png`,
  // Surfaces
  canvas: "#eaecf1",
  surface: "#ffffff",
  elevated: "#f7f8fa",
  headerBg: "#0d1220",
  borderSubtle: "#dde0e8",
  borderFaint: "#eceef3",
  // Ink (text)
  ink900: "#0d1220",
  ink600: "#495468",
  ink400: "#8890a2",
  // Accent — deep emerald
  accent600: "#0d7a58",
  accent50: "#f0faf5",
  accent100: "#daf2e9",
  // Status
  danger600: "#bf3129",
  danger100: "#fae3e1",
} as const;

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** A short, hidden preview line shown by inbox clients next to the subject. */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${brand.canvas};opacity:0;">${text}</div>`;
}

function layout(title: string, previewText: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${brand.canvas};font-family:${FONT_STACK};color:${brand.ink900};-webkit-font-smoothing:antialiased;">
    ${preheader(previewText)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.canvas};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${brand.surface};border:1px solid ${brand.borderSubtle};border-radius:16px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="background:${brand.headerBg};padding:22px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="${brand.logoUrl}" width="36" height="36" alt="${brand.name}" style="display:block;width:36px;height:36px;border-radius:9px;object-fit:contain;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.01em;">${brand.name}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px;font-size:15px;line-height:1.6;color:${brand.ink600};">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:22px 36px;background:${brand.elevated};border-top:1px solid ${brand.borderFaint};">
                <p style="margin:0;color:${brand.ink400};font-size:12px;line-height:1.6;">
                  This is an automated message from ${brand.name}. Please do not reply directly to this email.
                </p>
                <p style="margin:8px 0 0;color:${brand.ink400};font-size:12px;">
                  &copy; ${new Date().getFullYear()} ${brand.name}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;color:${brand.ink900};font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;">${text}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;color:${brand.ink600};font-size:15px;line-height:1.6;">${html}</p>`;
}

function strong(text: string): string {
  return `<strong style="color:${brand.ink900};font-weight:600;">${text}</strong>`;
}

function button(href: string, label: string): string {
  // Bulletproof-ish button: an anchor styled as a block with generous padding.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
    <tr>
      <td style="border-radius:10px;background:${brand.accent600};">
        <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function muted(html: string): string {
  return `<p style="margin:16px 0 0;color:${brand.ink400};font-size:13px;line-height:1.6;">${html}</p>`;
}

/** A highlighted "code" block used for temporary passwords / tokens. */
function codeBox(value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
    <tr>
      <td align="center" style="background:${brand.accent50};border:1px solid ${brand.accent100};border-radius:12px;padding:18px 16px;">
        <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:${brand.accent600};">${value}</span>
      </td>
    </tr>
  </table>`;
}

/** A callout box for warnings / rejection reasons. */
function calloutDanger(label: string, html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 14px;">
    <tr>
      <td style="background:${brand.danger100};border-left:4px solid ${brand.danger600};border-radius:8px;padding:14px 16px;">
        <span style="color:${brand.danger600};font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;">${label}</span>
        <p style="margin:6px 0 0;color:${brand.ink900};font-size:14px;line-height:1.6;">${html}</p>
      </td>
    </tr>
  </table>`;
}

/** A two-row summary table (label/value) used for figures like salary. */
function summaryRow(label: string, value: string, emphasize = false): string {
  return `<tr>
    <td style="padding:14px 18px;border-bottom:1px solid ${brand.borderFaint};">
      <span style="color:${brand.ink400};font-size:13px;">${label}</span>
    </td>
    <td align="right" style="padding:14px 18px;border-bottom:1px solid ${brand.borderFaint};">
      <span style="color:${emphasize ? brand.accent600 : brand.ink900};font-size:${emphasize ? "17px" : "15px"};font-weight:${emphasize ? "700" : "600"};">${value}</span>
    </td>
  </tr>`;
}

function summaryTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border:1px solid ${brand.borderSubtle};border-radius:12px;overflow:hidden;">
    ${rows}
  </table>`;
}

export function companyReceivedTemplate(companyName: string): string {
  return layout(
    "Application received",
    "Your company application is now under review.",
    `${heading("Application received")}
     ${paragraph(`Hi ${strong(companyName)},`)}
     ${paragraph("Thank you for registering. Your application is now under review by our team. You'll receive another email as soon as it's approved and you can log in.")}`,
  );
}

export function companyApprovedTemplate(companyName: string): string {
  const loginUrl = `${env.CLIENT_BASE_URL}/login`;
  return layout(
    "Your company has been approved",
    "You're approved — log in to finish your setup.",
    `${heading("You're approved 🎉")}
     ${paragraph(`Hi ${strong(companyName)},`)}
     ${paragraph("Your company registration has been approved. You can now log in and complete your company setup.")}
     ${button(loginUrl, "Log in to your account")}`,
  );
}

export function companyRejectedTemplate(companyName: string, reason: string): string {
  return layout(
    "Registration update",
    "An update on your company registration.",
    `${heading("Registration not approved")}
     ${paragraph(`Hi ${strong(companyName)},`)}
     ${paragraph("Unfortunately, your company registration could not be approved at this time.")}
     ${calloutDanger("Reason", reason)}
     ${paragraph("If you believe this is a mistake, please reach out to our support team.")}`,
  );
}

export function userInviteTemplate(name: string, companyName: string, tempPassword: string): string {
  const loginUrl = `${env.CLIENT_BASE_URL}/login`;
  return layout(
    "You've been invited",
    `An account has been created for you at ${companyName}.`,
    `${heading(`Welcome aboard, ${name}!`)}
     ${paragraph(`An account has been created for you at ${strong(companyName)}.`)}
     ${paragraph("Use the temporary password below to log in, then change it from your profile:")}
     ${codeBox(tempPassword)}
     ${button(loginUrl, "Log in")}`,
  );
}

export function passwordResetTemplate(name: string, token: string, email: string): string {
  const resetUrl = `${env.CLIENT_BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  return layout(
    "Reset your password",
    "Use the secure link to reset your password (expires in 1 hour).",
    `${heading("Password reset request")}
     ${paragraph(`Hi ${strong(name)},`)}
     ${paragraph("We received a request to reset your password. This link expires in 1 hour.")}
     ${button(resetUrl, "Reset password")}
     ${muted("If you didn't request this, you can safely ignore this email — your password won't change.")}`,
  );
}

export function emailVerificationTemplate(name: string, token: string, email: string): string {
  const verifyUrl = `${env.CLIENT_BASE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  return layout(
    "Verify your email",
    "Confirm your email address to activate your account.",
    `${heading("Confirm your email address")}
     ${paragraph(`Hi ${strong(name)},`)}
     ${paragraph("Thanks for registering. Please confirm your email address to activate your account. This link expires in 24 hours.")}
     ${button(verifyUrl, "Verify email")}
     ${muted("If you didn't create this account, you can safely ignore this email.")}`,
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
    `${input.companyName} sent you an invoice for ${input.amount}.`,
    `${heading(`Invoice ${input.invoiceNumber}`)}
     ${paragraph(`Hi ${strong(input.clientName)},`)}
     ${paragraph(`${strong(input.companyName)} has sent you an invoice.`)}
     ${summaryTable(
       summaryRow("Invoice number", input.invoiceNumber) +
         summaryRow("Due date", input.dueDate) +
         summaryRow("Amount due", input.amount, true),
     )}
     ${button(input.shareUrl, "View invoice")}`,
  );
}

export function salarySlipTemplate(input: {
  employeeName: string;
  companyName: string;
  month: string;
  year: number;
  grossSalary: string;
  netSalary: string;
  slipUrl: string;
}): string {
  return layout(
    `Salary Slip — ${input.month} ${input.year}`,
    `Your salary for ${input.month} ${input.year} has been processed.`,
    `${heading("Your salary slip is ready")}
     ${paragraph(`Hi ${strong(input.employeeName)},`)}
     ${paragraph(`${strong(input.companyName)} has processed your salary for ${strong(`${input.month} ${input.year}`)}.`)}
     ${summaryTable(
       summaryRow("Gross salary", input.grossSalary) +
         summaryRow("Net salary", input.netSalary, true),
     )}
     ${button(input.slipUrl, "View salary slip")}`,
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
    `A friendly reminder: invoice ${input.invoiceNumber} is due.`,
    `${heading("Payment reminder")}
     ${paragraph(`Hi ${strong(input.clientName)},`)}
     ${paragraph(`This is a friendly reminder about an outstanding invoice from ${strong(input.companyName)}.`)}
     ${summaryTable(
       summaryRow("Invoice number", input.invoiceNumber) +
         summaryRow("Due date", input.dueDate) +
         summaryRow("Amount due", input.amountDue, true),
     )}
     ${button(input.shareUrl, "View & pay invoice")}`,
  );
}
