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

function payload(
  actionType: string,
  overrides: { fullName?: string; redirectTo?: string; siteUrl?: string } = {},
) {
  return JSON.stringify({
    user: {
      email: "ali@example.com",
      user_metadata: { full_name: overrides.fullName ?? "Ali" },
    },
    email_data: {
      token: "123456",
      token_hash: "abc123",
      redirect_to: overrides.redirectTo ?? "https://vm.wanahnaf.dev/login",
      email_action_type: actionType,
      site_url: overrides.siteUrl ?? "https://vm.wanahnaf.dev",
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
    mockSend.mockClear();
  });

  it("sends recovery email with own-domain confirm link and text part", async () => {
    const res = await invoke(signedEvent(payload("recovery")));

    expect(res.statusCode).toBe(200);
    const email = mockSend.mock.calls[0][0];
    expect(email.subject).toBe("Reset Your Password - Vehicles Management");
    expect(email.to).toEqual([{ email: "ali@example.com", name: "Ali" }]);
    expect(email.htmlContent).toContain(
      'href="https://vm.wanahnaf.dev/auth/confirm?token_hash=abc123&amp;type=recovery"',
    );
    expect(email.textContent).toContain(
      "https://vm.wanahnaf.dev/auth/confirm?token_hash=abc123&type=recovery",
    );
    expect(email.htmlContent).not.toContain("supabase.co");
    expect(email).not.toHaveProperty("sender");
  });

  it("sends signup confirmation with the user's name", async () => {
    const res = await invoke(signedEvent(payload("signup")));

    expect(res.statusCode).toBe(200);
    const email = mockSend.mock.calls[0][0];
    expect(email.subject).toBe("Confirm Your Email - Vehicles Management");
    expect(email.htmlContent).toContain("Welcome, Ali!");
    expect(email.textContent).toContain("type=signup");
  });

  it("uses only the origin of redirect_to", async () => {
    await invoke(
      signedEvent(
        payload("recovery", {
          redirectTo: "http://localhost:8081/reset-password?x=1",
        }),
      ),
    );

    expect(mockSend.mock.calls[0][0].textContent).toContain(
      "http://localhost:8081/auth/confirm?token_hash=abc123&type=recovery",
    );
  });

  it("falls back to site_url when redirect_to is empty", async () => {
    await invoke(signedEvent(payload("signup", { redirectTo: "" })));

    expect(mockSend.mock.calls[0][0].textContent).toContain(
      "https://vm.wanahnaf.dev/auth/confirm?token_hash=abc123&type=signup",
    );
  });

  it("rejects when neither redirect_to nor site_url is a valid URL", async () => {
    const res = await invoke(
      signedEvent(payload("signup", { redirectTo: "", siteUrl: "" })),
    );

    expect(res.statusCode).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
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

  it.each(["magiclink", "email_change"])(
    "rejects unsupported action type %s",
    async (type) => {
      const res = await invoke(signedEvent(payload(type)));

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error.message).toContain(type);
      expect(mockSend).not.toHaveBeenCalled();
    },
  );

  it("escapes user-controlled name in html", async () => {
    await invoke(
      signedEvent(payload("signup", { fullName: "<script>x</script>" })),
    );

    const html = mockSend.mock.calls[0][0].htmlContent;
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script>x");
  });

  it("returns 500 when Brevo send fails", async () => {
    mockSend.mockResolvedValueOnce(false);

    const res = await invoke(signedEvent(payload("recovery")));

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error.message).toBe("Failed to send email");
  });
});
