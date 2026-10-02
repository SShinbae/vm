import { renderEmail } from "@/netlify/functions/_shared/email";
import ConfirmEmail, {
  confirmEmailSubject,
} from "@/netlify/functions/_shared/emails/ConfirmEmail";
import ResetPassword, {
  resetPasswordSubject,
} from "@/netlify/functions/_shared/emails/ResetPassword";
import GroupInvite, {
  groupInviteSubject,
} from "@/netlify/functions/_shared/emails/GroupInvite";

const url = "https://vm.wanahnaf.dev/auth/confirm?token_hash=abc&type=signup";
const htmlUrl = url.replace(/&/g, "&amp;");

describe("ConfirmEmail", () => {
  it("renders greeting, CTA, preheader and link in both parts", async () => {
    const { html, text } = await renderEmail(
      <ConfirmEmail name="Ali" actionUrl={url} />,
    );

    expect(confirmEmailSubject).toBe(
      "Confirm Your Email - Vehicles Management",
    );
    expect(html).toContain("Welcome, Ali!");
    expect(html).toContain("Confirm email address");
    expect(html).toContain(
      "Confirm your email to start using Vehicles Management",
    );
    expect(html).toContain(`href="${htmlUrl}"`);
    expect(text).toContain(url);
  });

  it("escapes markup in the name exactly once", async () => {
    const { html, text } = await renderEmail(
      <ConfirmEmail name={"<script>x</script> & co"} actionUrl={url} />,
    );

    expect(html).toContain("&lt;script&gt;x&lt;/script&gt; &amp; co");
    expect(html).not.toContain("<script>x");
    expect(html).not.toContain("&amp;amp;");
    // Plain-text conversion upper-cases headings; check raw (unescaped) chars.
    expect(text.toUpperCase()).toContain("<SCRIPT>X</SCRIPT> & CO");
  });

  it("keeps non-ascii names intact", async () => {
    const { html, text } = await renderEmail(
      <ConfirmEmail name="Zoë 李" actionUrl={url} />,
    );

    expect(html).toContain("Zoë 李");
    expect(text.toUpperCase()).toContain("ZOË 李");
  });
});

describe("ResetPassword", () => {
  it("renders CTA, preheader and link in both parts", async () => {
    const resetUrl = url.replace("signup", "recovery");
    const { html, text } = await renderEmail(
      <ResetPassword actionUrl={resetUrl} />,
    );

    expect(resetPasswordSubject).toBe(
      "Reset Your Password - Vehicles Management",
    );
    expect(html).toContain("Reset password");
    expect(html).toContain("Reset your Vehicles Management password");
    expect(html).toContain(`href="${resetUrl.replace(/&/g, "&amp;")}"`);
    expect(text).toContain(resetUrl);
  });
});

describe("GroupInvite", () => {
  it("renders inviter, group and CTA", async () => {
    const { html, text } = await renderEmail(
      <GroupInvite
        inviterName="Ali"
        groupName="Family Cars"
        actionUrl="https://vm.wanahnaf.dev"
      />,
    );

    expect(groupInviteSubject("Ali", "Family Cars")).toBe(
      "Ali invited you to join Family Cars",
    );
    expect(html).toContain("Open Vehicles Management");
    expect(html).toContain("Ali invited you to join Family Cars");
    expect(text).toContain("Family Cars");
    expect(text).toContain("https://vm.wanahnaf.dev");
  });

  it("escapes group and inviter names exactly once", async () => {
    const { html } = await renderEmail(
      <GroupInvite
        inviterName={"<b>Eve</b>"}
        groupName={"Tom & Jerry <Fleet>"}
        actionUrl="https://vm.wanahnaf.dev"
      />,
    );

    expect(html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
    expect(html).toContain("Tom &amp; Jerry &lt;Fleet&gt;");
    expect(html).not.toContain("<b>Eve");
    expect(html).not.toContain("&amp;amp;");
  });
});
