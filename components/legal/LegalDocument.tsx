import { CONTACT_EMAIL } from "@/components/landing/content";
import type { LegalDocumentData } from "@/lib/legal/documents";
import React from "react";
import { Linking, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

/** Renders a privacy policy or terms document with semantic headings. */
export function LegalDocument({
  doc,
  showTitle = true,
}: {
  doc: LegalDocumentData;
  showTitle?: boolean;
}) {
  const { theme } = useStyles();

  const body = {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.fontSize.base * 1.6,
  };

  // Turn the contact address into a mailto link wherever it appears.
  const withEmailLink = (text: string) =>
    text.split(CONTACT_EMAIL).flatMap((part, i) =>
      i === 0
        ? [part]
        : [
            <Text
              key={i}
              style={{ color: theme.colors.primary }}
              accessibilityRole="link"
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>,
            part,
          ],
    );

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={{ gap: theme.spacing.sm }}>
        {showTitle && (
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={{
              fontSize: theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            {doc.title}
          </Text>
        )}
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          Last updated: {doc.lastUpdated}
        </Text>
        <Text style={body}>{withEmailLink(doc.intro)}</Text>
      </View>

      {doc.sections.map((section) => (
        <View key={section.heading} style={{ gap: theme.spacing.sm }}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            {section.heading}
          </Text>
          {section.paragraphs?.map((p) => (
            <Text key={p} style={body}>
              {withEmailLink(p)}
            </Text>
          ))}
          {section.bullets?.map((b) => (
            <View
              key={b}
              style={{ flexDirection: "row", gap: theme.spacing.sm }}
            >
              <Text style={body}>•</Text>
              <Text style={[body, { flex: 1 }]}>{withEmailLink(b)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
