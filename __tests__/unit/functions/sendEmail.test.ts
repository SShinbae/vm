jest.mock("@/netlify/functions/_shared/email", () => ({
  ...jest.requireActual("@/netlify/functions/_shared/email"),
  sendBrevoEmail: jest.fn().mockResolvedValue(true),
}));

import { Webhook } from "standardwebhooks";
import type { HandlerEvent } from "@netlify/functions";
import { handler } from "@/netlify/functions/send-email";
import { sendBrevoEmail } from "@/netlify/functions/_shared/email";

const secret = Buffer.from("test-hook-secret-0123456789").toString("base64");
const mockSend = sendBrevoEmail as jest.Mock;

function payload(actionType: string, fullName = "Ali") {
  return JSON.stringify({
    user: { email: "ali@example.com", user_metadata: { full_name: fullName } },
    email_data: {
      token: "123456",
      token_hash: "abc123",
      redirect_to: "https://vm.wanahnaf.dev/login",
      email_action_type: actionType,
      site_url: "https://vm.wanahnaf.dev",
    },
  });
}

function signedEvent(body: string): HandlerEvent {
  const id = "msg_test";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, body);
  return {
    httpMethod: "POST",
    body,
    isBase64Encoded: false,
    headers: {
      "webhook-id": id,
      "webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
      "webhook-signature": signature,
    },
  } as unknown as HandlerEvent;
}

const invoke = (event: HandlerEvent) =>
  (handler as any)(event, {}) as Promise<{ statusCode: number; body: string }>;

describe("send-email hook", () => {
  beforeEach(() => {
    process.env.SEND_EMAIL_HOOK_SECRET = `v1,whsec_${secret}`;
    process.env.SUPABASE_URL = "https://proj.supabase.co";
    mockSend.mockClear();
  });

  it("sends recovery email with verify link", async () => {
    const res = await invoke(signedEvent(payload("recovery")));

    expect(res.statusCode).toBe(200);
    const email = mockSend.mock.calls[0][0];
    expect(email.subject).toBe("Reset Your Password - Vehicles Management");
    expect(email.to).toEqual([{ email: "ali@example.com", name: "Ali" }]);
    expect(email.htmlContent).toContain(
      "https://proj.supabase.co/auth/v1/verify?token=abc123&amp;type=recovery&amp;redirect_to=https%3A%2F%2Fvm.wanahnaf.dev%2Flogin",
    );
  });

  it("rejects bad signature without sending", async () => {
    const event = signedEvent(payload("signup"));
    event.headers["webhook-signature"] = "v1,Zm9vYmFy";

    const res = await invoke(event);

    expect(res.statusCode).toBe(401);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("fails closed when secret is not configured", async () => {
    delete process.env.SEND_EMAIL_HOOK_SECRET;

    const res = await invoke(signedEvent(payload("signup")));

    expect(res.statusCode).toBe(500);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects unsupported action types", async () => {
    const res = await invoke(signedEvent(payload("email_change")));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.message).toContain("email_change");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("escapes user-controlled name in html", async () => {
    await invoke(signedEvent(payload("signup", "<script>x</script>")));

    const html = mockSend.mock.calls[0][0].htmlContent;
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script>x");
  });
});
