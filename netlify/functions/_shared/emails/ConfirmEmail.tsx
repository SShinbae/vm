import { Heading, Text } from "@react-email/components";
import { ActionButton, Layout, styles } from "./Layout";

export const confirmEmailSubject = "Confirm Your Email - Vehicles Management";

interface ConfirmEmailProps {
  name: string;
  actionUrl: string;
}

export default function ConfirmEmail({ name, actionUrl }: ConfirmEmailProps) {
  return (
    <Layout
      preview="Confirm your email to start using Vehicles Management"
      reason="You received this email because this address was used to sign up for Vehicles Management. If that wasn't you, you can ignore it."
    >
      <Heading as="h2" style={styles.heading}>
        Welcome, {name}!
      </Heading>
      <Text style={styles.paragraph}>
        Thanks for signing up. Confirm your email address to activate your
        account.
      </Text>
      <ActionButton href={actionUrl}>Confirm email address</ActionButton>
      <Text style={styles.muted}>
        For your security, this link expires after a short time.
      </Text>
    </Layout>
  );
}

ConfirmEmail.PreviewProps = {
  name: "Ali",
  actionUrl:
    "https://vm.wanahnaf.dev/auth/confirm?token_hash=preview&type=signup",
} satisfies ConfirmEmailProps;
