import { Heading, Text } from "@react-email/components";
import { Layout, styles } from "./Layout";

export const accountDeletedSubject =
  "Your account has been deleted - Vehicles Management";

interface AccountDeletedProps {
  name: string;
}

export default function AccountDeleted({ name }: AccountDeletedProps) {
  return (
    <Layout
      preview="Your Vehicles Management account has been deleted"
      reason="You received this email because your Vehicles Management account was deleted at your request."
    >
      <Heading as="h2" style={styles.heading}>
        Account deleted
      </Heading>
      <Text style={styles.paragraph}>Hi {name || "there"},</Text>
      <Text style={styles.paragraph}>
        Your account and its vehicles, logs, receipts and images have been
        permanently deleted. This can&apos;t be undone. You&apos;re welcome to
        create a new account at any time.
      </Text>
    </Layout>
  );
}

AccountDeleted.PreviewProps = { name: "Ali" } satisfies AccountDeletedProps;
