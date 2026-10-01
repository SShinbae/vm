import type { Handler, HandlerEvent } from "@netlify/functions";
import { Webhook } from "standardwebhooks";
import {
  escapeHtml,
  sendBrevoEmail,
  SENDER_EMAIL,
  SENDER_NAME,
} from "./_shared/email";

// Supabase Send Email Hook payload:
// https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
interface SendEmailHookPayload {
  user: {
    email: string;
    user_metadata?: { full_name?: string };
  };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

function getConfirmationEmailHtml(
  name: string,
  confirmationUrl: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
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
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Please confirm your email address by clicking the button below:
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${confirmationUrl}"
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${confirmationUrl}
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                If you didn't create an account, you can safely ignore this email.
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

function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email.
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

function getMagicLinkEmailHtml(magicLinkUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In Link</title>
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
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Sign In to Your Account</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to your account:
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${magicLinkUrl}"
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${magicLinkUrl}
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                If you didn't request this link, you can safely ignore this email.
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

function hookError(httpCode: number, message: string) {
  return {
    statusCode: httpCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: { http_code: httpCode, message } }),
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return hookError(405, "Method not allowed");
  }

  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!hookSecret || !supabaseUrl) {
    console.error("SEND_EMAIL_HOOK_SECRET or SUPABASE_URL is not configured");
    return hookError(500, "Email hook is not configured");
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";

  let payload: SendEmailHookPayload;
  try {
    payload = new Webhook(hookSecret.replace("v1,whsec_", "")).verify(
      rawBody,
      event.headers as Record<string, string>,
    ) as SendEmailHookPayload;
  } catch (error) {
    console.error("Invalid hook signature:", error);
    return hookError(401, "Invalid signature");
  }

  try {
    const email = payload.user?.email;
    const { token_hash, redirect_to, email_action_type } =
      payload.email_data || ({} as SendEmailHookPayload["email_data"]);

    if (!email || !token_hash || !email_action_type) {
      return hookError(400, "Missing email, token_hash or email_action_type");
    }

    const params = new URLSearchParams({
      token: token_hash,
      type: email_action_type,
      redirect_to: redirect_to || "",
    });
    const actionUrl = escapeHtml(`${supabaseUrl}/auth/v1/verify?${params}`);
    const recipientName =
      payload.user.user_metadata?.full_name || email.split("@")[0];
    const safeName = escapeHtml(recipientName);

    let subject: string;
    let htmlContent: string;

    switch (email_action_type) {
      case "signup":
        subject = "Confirm Your Email - Vehicles Management";
        htmlContent = getConfirmationEmailHtml(safeName, actionUrl);
        break;
      case "recovery":
        subject = "Reset Your Password - Vehicles Management";
        htmlContent = getPasswordResetEmailHtml(actionUrl);
        break;
      case "magiclink":
        subject = "Sign In to Vehicles Management";
        htmlContent = getMagicLinkEmailHtml(actionUrl);
        break;
      default:
        return hookError(400, `Unsupported email type: ${email_action_type}`);
    }

    const success = await sendBrevoEmail({
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email, name: recipientName }],
      subject,
      htmlContent,
    });

    if (!success) {
      return hookError(500, "Failed to send email");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: "{}",
    };
  } catch (error) {
    console.error("Email handler error:", error);
    return hookError(500, "Internal server error");
  }
};
