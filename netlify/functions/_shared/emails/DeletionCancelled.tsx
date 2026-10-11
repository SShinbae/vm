import { Heading, Text } from "@react-email/components";
import { Layout, styles } from "./Layout";

export const deletionCancelledSubject =
  "Account deletion cancelled - Vehicles Management";

interface DeletionCancelledProps {
  name: string;
}

export default function DeletionCancelled({ name }: DeletionCancelledProps) {
  return (
    <Layout
      preview="Your account will not be deleted"
      reason="You received this email because account deletion was cancelled for your Vehicles Management account."
    >
      <Heading as="h2" style={styles.heading}>
        Deletion cancelled
      </Heading>
      <Text style={styles.paragraph}>Hi {name || "there"},</Text>
      <Text style={styles.paragraph}>
        Your account will not be deleted. Everything stays as it was, and you
        can keep using Vehicles Management as normal.
      </Text>
    </Layout>
  );
}

DeletionCancelled.PreviewProps = {
  name: "Ali",
} satisfies DeletionCancelledProps;
