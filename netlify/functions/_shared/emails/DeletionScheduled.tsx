import { Heading, Text } from "@react-email/components";
import { ActionButton, Layout, styles } from "./Layout";

export const deletionScheduledSubject =
  "Your account will be deleted - Vehicles Management";

export function formatDeletionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface DeletionScheduledProps {
  name: string;
  deletionDate: string;
  signInUrl: string;
}

export default function DeletionScheduled({
  name,
  deletionDate,
  signInUrl,
}: DeletionScheduledProps) {
  return (
    <Layout
      preview={`Your account will be deleted on ${deletionDate}`}
      reason="You received this email because account deletion was requested from your Vehicles Management account."
    >
      <Heading as="h2" style={styles.heading}>
        Your account is scheduled for deletion
      </Heading>
      <Text style={styles.paragraph}>Hi {name || "there"},</Text>
      <Text style={styles.paragraph}>
        Your account and your own vehicles, logs, receipts and images will be
        permanently deleted on {deletionDate}. Logs you added to family
        members&apos; vehicles will stay on those vehicles without your name,
        with any receipt photos attached to them.
      </Text>
      <Text style={styles.paragraph}>
        Changed your mind? Sign in before then and select Cancel deletion.
      </Text>
      <ActionButton href={signInUrl}>Sign in to cancel deletion</ActionButton>
      <Text style={styles.muted}>
        If you didn&apos;t ask for this, sign in and cancel, then change your
        password, or secure your Google account if you sign in with Google.
      </Text>
    </Layout>
  );
}

DeletionScheduled.PreviewProps = {
  name: "Ali",
  deletionDate: "10 November 2026",
  signInUrl: "https://vm.wanahnaf.dev/login",
} satisfies DeletionScheduledProps;
