import { Heading, Text } from "@react-email/components";
import { ActionButton, Layout, styles } from "./Layout";

export function groupInviteSubject(inviterName: string, groupName: string) {
  return `${inviterName} invited you to join ${groupName}`;
}

interface GroupInviteProps {
  inviterName: string;
  groupName: string;
  actionUrl: string;
}

export default function GroupInvite({
  inviterName,
  groupName,
  actionUrl,
}: GroupInviteProps) {
  return (
    <Layout
      preview={groupInviteSubject(inviterName, groupName)}
      reason="You received this email because someone invited this address to a group on Vehicles Management. If you weren't expecting it, you can ignore it."
    >
      <Heading as="h2" style={styles.heading}>
        You&apos;re invited to join {groupName}
      </Heading>
      <Text style={styles.paragraph}>
        {inviterName} invited you to join the group <strong>{groupName}</strong>{" "}
        on Vehicles Management. Open the app to accept the invitation. If you
        don&apos;t have an account yet, sign up with this email address and the
        invitation will be waiting for you.
      </Text>
      <ActionButton href={actionUrl}>Open Vehicles Management</ActionButton>
      <Text style={styles.muted}>This invitation expires in 7 days.</Text>
    </Layout>
  );
}

GroupInvite.PreviewProps = {
  inviterName: "Ali",
  groupName: "Family Cars",
  actionUrl: "https://vm.wanahnaf.dev",
} satisfies GroupInviteProps;
