import { IconSymbol } from "@/components/ui/icon-symbol";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { LegalDocument } from "./LegalDocument";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal/documents";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export type LegalTab = "privacy" | "terms";

// Native in-app Privacy & Terms screen (app/privacy.tsx, app/terms.tsx). On
// web, privacy.web.tsx and terms.web.tsx serve the public pages instead.
export function LegalScreen({ initialTab }: { initialTab: LegalTab }) {
  const { theme } = useStyles();
  const [activeSection, setActiveSection] = useState<LegalTab>(initialTab);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const SectionTab = ({
    section,
    label,
  }: {
    section: LegalTab;
    label: string;
  }) => {
    const isActive = activeSection === section;
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: isActive ? theme.colors.primary : "transparent",
          alignItems: "center",
        }}
        onPress={() => setActiveSection(section)}
        accessibilityRole="tab"
        accessibilityLabel={`${label} tab`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={{
            color: isActive ? theme.colors.white : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: isActive
              ? theme.fontWeight.semibold
              : theme.fontWeight.normal,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleGoBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.background,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
              }}
            >
              Privacy & Terms
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs,
              }}
            >
              Your rights and our policies
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <SectionTab section="privacy" label="Privacy Policy" />
          <SectionTab section="terms" label="Terms of Service" />
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.xl,
            paddingBottom: theme.spacing.xxl,
          }}
        >
          <LegalDocument
            doc={
              activeSection === "privacy" ? PRIVACY_POLICY : TERMS_OF_SERVICE
            }
            showTitle={false}
          />
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
