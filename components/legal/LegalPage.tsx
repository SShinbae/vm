import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Section, useBreakpoint } from "@/components/landing/layout";
import type { LegalDocumentData } from "@/lib/legal/documents";
import { Link, useRouter } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStyles } from "react-native-unistyles";
import { LegalDocument } from "./LegalDocument";

/** Public web page (no sign-in) for a legal document, framed like the landing page. */
export function LegalPage({
  doc,
  description,
  other,
}: {
  doc: LegalDocumentData;
  description: string;
  other: { href: "/privacy" | "/terms"; label: string };
}) {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  return (
    <>
      <Head>
        <title>{`${doc.title} - Vehicle Management`}</title>
        <meta name="description" content={description} />
      </Head>
      {/* Head stays outside: stickyHeaderIndices counts ScrollView children. */}
      <ScrollView
        stickyHeaderIndices={[0]}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <LandingNav onNavigate={() => router.push("/")} />
        <Section style={{ paddingVertical: isMobile ? 40 : 72 }}>
          <View style={{ maxWidth: 760, width: "100%", alignSelf: "center" }}>
            <Link
              href="/"
              accessibilityLabel="Back to home"
              style={{
                alignSelf: "flex-start",
                marginBottom: theme.spacing.xl,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                }}
              >
                <IconSymbol
                  name="chevron.left"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.colors.primary,
                  }}
                >
                  Back to home
                </Text>
              </View>
            </Link>
            <LegalDocument doc={doc} />
            <Text
              style={{
                marginTop: theme.spacing.xxl,
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              See also:{" "}
              <Link href={other.href} style={{ color: theme.colors.primary }}>
                {other.label}
              </Link>
            </Text>
          </View>
        </Section>
        <LandingFooter />
      </ScrollView>
    </>
  );
}
