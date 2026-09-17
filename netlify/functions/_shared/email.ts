// Shared Brevo email sender + templates, reused across Netlify functions.

export interface BrevoEmailRequest {
  sender: { email: string; name: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

const BREVO_API_KEY = process.env.BREVO_API_KEY!;

export const SENDER_EMAIL =
  process.env.SENDER_EMAIL || "noreply@vm.wanahnaf.dev";
export const SENDER_NAME = process.env.SENDER_NAME || "Vehicles Management";

export async function sendBrevoEmail(
  emailData: BrevoEmailRequest,
): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Brevo send error:", error);
    return false;
  }
}

export function getInvitationEmailHtml(
  inviterName: string,
  groupName: string,
  actionUrl: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Group Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Vehicles Management</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">You're invited to join ${groupName}</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${inviterName} invited you to join the group <strong>${groupName}</strong> on Vehicles Management. Open the app to accept the invitation. If you don't have an account yet, sign up with this email address and the invitation will be waiting for you.
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${actionUrl}"
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Open Vehicles Management
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${actionUrl}
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
