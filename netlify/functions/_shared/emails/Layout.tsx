import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { SITE_URL, SUPPORT_EMAIL } from "../email";

const BRAND = "#4F46E5";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const styles = {
  heading: {
    margin: "0 0 16px",
    color: "#1f2937",
    fontSize: "22px",
    fontWeight: 600,
    lineHeight: "1.3",
  },
  paragraph: {
    margin: "0 0 16px",
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: "1.6",
  },
  muted: {
    margin: "0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.6",
  },
} satisfies Record<string, CSSProperties>;

interface LayoutProps {
  preview: string;
  reason: string;
  children: ReactNode;
}

export function Layout({ preview, reason, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>Vehicles Management</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Section style={hrRow}>
            <Hr style={hr} />
          </Section>
          <Section style={footer}>
            <Text style={footerText}>{reason}</Text>
            <Text style={footerText}>
              Need help? Contact{" "}
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>
                {SUPPORT_EMAIL}
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={SITE_URL} style={footerLink}>
                Vehicles Management
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

interface ActionButtonProps {
  href: string;
  children: ReactNode;
}

export function ActionButton({ href, children }: ActionButtonProps) {
  return (
    <>
      <Section style={buttonRow}>
        <Button href={href} style={button}>
          {children}
        </Button>
      </Section>
      <Text style={styles.muted}>
        Or copy and paste this link into your browser:
      </Text>
      <Text style={fallbackLink}>
        <Link href={href} style={{ color: BRAND }}>
          {href}
        </Link>
      </Text>
    </>
  );
}

const body: CSSProperties = {
  margin: 0,
  padding: "32px 0",
  backgroundColor: "#f4f4f5",
  fontFamily: FONT,
};
const container: CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
};
const header: CSSProperties = {
  backgroundColor: BRAND,
  padding: "28px 40px",
  textAlign: "center",
};
const wordmark: CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
};
const content: CSSProperties = { padding: "32px 40px 8px" };
const buttonRow: CSSProperties = { padding: "8px 0 24px", textAlign: "center" };
const button: CSSProperties = {
  backgroundColor: BRAND,
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: "8px",
  padding: "14px 28px",
};
const fallbackLink: CSSProperties = {
  margin: "4px 0 24px",
  fontSize: "14px",
  wordBreak: "break-all",
};
// Hr is width:100%; side spacing comes from the wrapping Section's padding.
const hrRow: CSSProperties = { padding: "0 40px" };
const hr: CSSProperties = { borderColor: "#e5e7eb", margin: 0 };
const footer: CSSProperties = { padding: "16px 40px 32px" };
const footerText: CSSProperties = {
  margin: "0 0 8px",
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center",
};
const footerLink: CSSProperties = { color: "#6b7280" };
