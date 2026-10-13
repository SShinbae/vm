import { CONTACT_EMAIL } from "@/components/landing/content";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Section, useBreakpoint } from "@/components/landing/layout";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Link, router } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function DeleteAccountPage() {
  const { theme } = useStyles();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const body = {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    lineHeight: 26,
  };
  const h2 = {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  };

  return (
    <>
      <Head>
        <title>Delete Your Account - Vehicle Management</title>
        <meta
          name="description"
          content="How to delete your Vehicle Management account and what happens to your data."
        />
      </Head>
      <ScrollView
        stickyHeaderIndices={[0]}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <LandingNav onNavigate={() => router.push("/")} />
        <Section style={{ paddingVertical: isMobile ? 40 : 72 }}>
          <View
            style={{
              maxWidth: 760,
              width: "100%",
              alignSelf: "center",
              gap: theme.spacing.lg,
            }}
          >
            <Link
              href="/"
              accessibilityLabel="Back to home"
              style={{ alignSelf: "flex-start" }}
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
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize["2xl"],
                fontWeight: theme.fontWeight.bold,
              }}
            >
              Delete your account
            </Text>
            <Text accessibilityRole="header" aria-level={2} style={h2}>
              How to delete
            </Text>
            <Text style={body}>
              1. Sign in to Vehicle Management.{"\n"}
              2. Go to Profile, then Delete account.{"\n"}
              3. Type DELETE and confirm.
            </Text>
            <Button
              title={
                user ? "Delete my account" : "Sign in to delete my account"
              }
              variant="danger"
              onPress={() =>
                router.push(
                  (user
                    ? "/account/delete"
                    : "/(auth)/login?next=/account/delete") as never,
                )
              }
            />
            <Text accessibilityRole="header" aria-level={2} style={h2}>
              What happens next
            </Text>
            <Text style={body}>
              Your account is deleted 30 days after you confirm. Sign in before
              then to cancel. We delete your profile, vehicles, logs, receipts
              and photos, groups you own with no other members, and your
              notification settings. Logs you added to family members&apos;
              vehicles stay on those vehicles without your name, with any
              receipt photos attached to them.
            </Text>
            <Text accessibilityRole="header" aria-level={2} style={h2}>
              Can&apos;t sign in?
            </Text>
            <Text style={body}>
              Email{" "}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                style={{ color: theme.colors.primary }}
              >
                {CONTACT_EMAIL}
              </Link>{" "}
              from the email address on your account and we&apos;ll delete it
              for you.
            </Text>
          </View>
        </Section>
        <LandingFooter />
      </ScrollView>
    </>
  );
}
