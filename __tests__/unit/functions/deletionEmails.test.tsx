import { renderEmail } from "@/netlify/functions/_shared/email";
import DeletionScheduled, {
  deletionScheduledSubject,
  formatDeletionDate,
} from "@/netlify/functions/_shared/emails/DeletionScheduled";
import DeletionCancelled, {
  deletionCancelledSubject,
} from "@/netlify/functions/_shared/emails/DeletionCancelled";
import AccountDeleted, {
  accountDeletedSubject,
} from "@/netlify/functions/_shared/emails/AccountDeleted";

describe("account deletion emails", () => {
  it("formats the deletion date in UTC, en-GB", () => {
    expect(formatDeletionDate("2026-11-10T23:30:00.000Z")).toBe(
      "10 November 2026",
    );
  });

  it("scheduled: date, how to cancel, sign-in link", async () => {
    const { html, text } = await renderEmail(
      <DeletionScheduled
        name="Ali"
        deletionDate="10 November 2026"
        signInUrl="https://vm.wanahnaf.dev/login"
      />,
    );
    expect(deletionScheduledSubject).toBe(
      "Your account will be deleted - Vehicles Management",
    );
    expect(html).toContain("Hi Ali,");
    expect(html).toContain("10 November 2026");
    expect(html).toContain("Cancel deletion");
    expect(html).toContain('href="https://vm.wanahnaf.dev/login"');
    expect(text).toContain("https://vm.wanahnaf.dev/login");
  });

  it("cancelled: confirms the account stays", async () => {
    const { html } = await renderEmail(<DeletionCancelled name="Ali" />);
    expect(deletionCancelledSubject).toBe(
      "Account deletion cancelled - Vehicles Management",
    );
    expect(html).toContain("Hi Ali,");
    expect(html).toContain("will not be deleted");
  });

  it("deleted: final notice, falls back when there is no name", async () => {
    const { html } = await renderEmail(<AccountDeleted name="" />);
    expect(accountDeletedSubject).toBe(
      "Your account has been deleted - Vehicles Management",
    );
    expect(html).toContain("Hi there,");
    expect(html).toContain("permanently deleted");
  });

  it("escapes markup in the name", async () => {
    const { html } = await renderEmail(<DeletionCancelled name={"<b>x</b>"} />);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
});
