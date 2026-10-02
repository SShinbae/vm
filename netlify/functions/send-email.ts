import type { Handler, HandlerEvent } from "@netlify/functions";
import { createElement, type ReactElement } from "react";
import { Webhook } from "standardwebhooks";
import { renderEmail, sendBrevoEmail } from "./_shared/email";
import ConfirmEmail, {
  confirmEmailSubject,
} from "./_shared/emails/ConfirmEmail";
import ResetPassword, {
  resetPasswordSubject,
} from "./_shared/emails/ResetPassword";

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
  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET is not configured");
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
    const { token_hash, redirect_to, email_action_type, site_url } =
      payload.email_data || ({} as SendEmailHookPayload["email_data"]);

    if (!email || !token_hash || !email_action_type) {
      return hookError(400, "Missing email, token_hash or email_action_type");
    }

    // Supabase has already checked redirect_to against the redirect allow-list.
    let origin: string;
    try {
      origin = new URL(redirect_to || site_url).origin;
    } catch {
      return hookError(400, "Missing or invalid redirect_to/site_url");
    }

    const params = new URLSearchParams({ token_hash, type: email_action_type });
    const actionUrl = `${origin}/auth/confirm?${params}`;
    const recipientName =
      payload.user.user_metadata?.full_name || email.split("@")[0];

    let subject: string;
    let element: ReactElement;

    switch (email_action_type) {
      case "signup":
        subject = confirmEmailSubject;
        element = createElement(ConfirmEmail, {
          name: recipientName,
          actionUrl,
        });
        break;
      case "recovery":
        subject = resetPasswordSubject;
        element = createElement(ResetPassword, { actionUrl });
        break;
      default:
        return hookError(400, `Unsupported email type: ${email_action_type}`);
    }

    const { html, text } = await renderEmail(element);
    const success = await sendBrevoEmail({
      to: [{ email, name: recipientName }],
      subject,
      htmlContent: html,
      textContent: text,
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
