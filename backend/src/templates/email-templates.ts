type OtpPurpose = "verify_email" | "reset_password";

interface OtpTemplateInput {
  otp: string;
  purpose: OtpPurpose;
}

function getTemplateContent(purpose: OtpPurpose) {
  if (purpose === "verify_email") {
    return {
      title: "Verify your email",
      subtitle: "Welcome! Please verify your email to activate your account.",
      action: "verify your email",
      accent: "#2563eb",
    };
  }

  return {
    title: "Reset your password",
    subtitle: "We received a request to reset your password.",
    action: "reset your password",
    accent: "#7c3aed",
  };
}

export function buildOtpEmailTemplate(input: OtpTemplateInput) {
  const content = getTemplateContent(input.purpose);

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <tr>
                <td style="background:${content.accent};padding:28px 24px;color:#ffffff;">
                  <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;">${content.title}</h1>
                  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;opacity:0.95;">${content.subtitle}</p>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 24px 12px 24px;">
                  <p style="margin:0 0 10px 0;font-size:15px;line-height:1.7;color:#374151;">
                    Use the OTP below to ${content.action}.
                  </p>

                  <div style="margin:18px 0;padding:14px 16px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:12px;text-align:center;">
                    <span style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827;">
                      ${input.otp}
                    </span>
                  </div>

                  <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
                    This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 24px 26px 24px;">
                  <p style="margin:0;font-size:12px;line-height:1.7;color:#6b7280;">
                    If you did not request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:14px 0 0 0;font-size:12px;color:#9ca3af;">
              Sent by Auth
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
