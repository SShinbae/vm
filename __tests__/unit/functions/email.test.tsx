import { Text } from "@react-email/components";
import { renderEmail, sendBrevoEmail } from "@/netlify/functions/_shared/email";
import {
  ActionButton,
  Layout,
} from "@/netlify/functions/_shared/emails/Layout";

describe("renderEmail + Layout", () => {
  it("renders preheader, header, footer and action link in html and text", async () => {
    const { html, text } = await renderEmail(
      <Layout preview="Preview line" reason="Because you asked.">
        <Text>Body copy</Text>
        <ActionButton href="https://vm.wanahnaf.dev/go?a=1&b=2">
          Do it
        </ActionButton>
      </Layout>,
    );

    expect(html.startsWith("<!DOCTYPE html")).toBe(true);
    expect(html).toContain("Preview line");
    expect(html).toContain("Vehicles Management");
    expect(html).toContain("background-color:#4F46E5");
    expect(html).not.toMatch(/gradient/i);
    expect(html).toContain('href="https://vm.wanahnaf.dev/go?a=1&amp;b=2"');
    expect(html).toContain("support@wanahnaf.dev");
    expect(html).toContain("Because you asked.");

    expect(text).toContain("Body copy");
    expect(text).toContain("https://vm.wanahnaf.dev/go?a=1&b=2");
    expect(text).toContain("support@wanahnaf.dev");
  });
});

describe("Layout divider", () => {
  it("does not combine width:100% with side margins (overflows the container)", async () => {
    const { html } = await renderEmail(
      <Layout preview="p" reason="r">
        <Text>x</Text>
      </Layout>,
    );

    const hrStyle = html.match(/<hr[^>]*style="([^"]*)"/)?.[1] ?? "";
    expect(hrStyle).toContain("width:100%");
    expect(hrStyle).not.toMatch(/margin:0 40px/);
  });
});

describe("sendBrevoEmail", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("posts sender, replyTo, html and text to Brevo", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const ok = await sendBrevoEmail({
      to: [{ email: "a@example.com", name: "A" }],
      subject: "Hi",
      htmlContent: "<p>Hi</p>",
      textContent: "Hi",
    });

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(JSON.parse(init.body)).toEqual({
      sender: { email: "noreply@vm.wanahnaf.dev", name: "Vehicles Management" },
      replyTo: { email: "support@wanahnaf.dev" },
      to: [{ email: "a@example.com", name: "A" }],
      subject: "Hi",
      htmlContent: "<p>Hi</p>",
      textContent: "Hi",
    });
  });

  it("returns false when Brevo rejects", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad sender",
    });

    await expect(
      sendBrevoEmail({
        to: [{ email: "a@example.com" }],
        subject: "Hi",
        htmlContent: "<p>Hi</p>",
        textContent: "Hi",
      }),
    ).resolves.toBe(false);
  });
});
