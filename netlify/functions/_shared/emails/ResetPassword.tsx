import { Heading, Text } from "@react-email/components";
import { ActionButton, Layout, styles } from "./Layout";

export const resetPasswordSubject = "Reset Your Password - Vehicles Management";

interface ResetPasswordProps {
  actionUrl: string;
}

export default function ResetPassword({ actionUrl }: ResetPasswordProps) {
  return (
    <Layout
      preview="Reset your Vehicles Management password"
      reason="You received this email because a password reset was requested for your account. If you didn't request it, you can ignore this email and your password won't change."
    >
      <Heading as="h2" style={styles.heading}>
        Reset your password
      </Heading>
      <Text style={styles.paragraph}>
        We received a request to reset your password. Choose a new one using the
        button below.
      </Text>
      <ActionButton href={actionUrl}>Reset password</ActionButton>
      <Text style={styles.muted}>
        For your security, this link expires after a short time.
      </Text>
    </Layout>
  );
}

ResetPassword.PreviewProps = {
  actionUrl:
    "https://vm.wanahnaf.dev/auth/confirm?token_hash=preview&type=recovery",
} satisfies ResetPasswordProps;
