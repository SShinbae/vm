// Shared Brevo email sender + rendering, reused across Netlify functions.
import { toPlainText } from "@react-email/render";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export interface BrevoEmailRequest {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
}

const BREVO_API_KEY = process.env.BREVO_API_KEY!;

export const SENDER_EMAIL =
  process.env.SENDER_EMAIL || "noreply@vm.wanahnaf.dev";
export const SENDER_NAME = process.env.SENDER_NAME || "Vehicles Management";
export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || "support@wanahnaf.dev";
export const SITE_URL = process.env.SITE_URL || "https://vm.wanahnaf.dev";

const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

// Same output as @react-email/render's render(), which can't be used here:
// it loads react-dom/server via dynamic import(), which Jest's CJS runtime
// rejects. Templates are synchronous, so static markup is sufficient.
export async function renderEmail(
  element: ReactElement,
): Promise<{ html: string; text: string }> {
  const markup = renderToStaticMarkup(element);
  return { html: `${DOCTYPE}${markup}`, text: toPlainText(markup) };
}

export async function sendBrevoEmail(
  email: BrevoEmailRequest,
): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        replyTo: { email: SUPPORT_EMAIL },
        ...email,
      }),
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
