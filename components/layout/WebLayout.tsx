import { spacing } from "@/src/design-system";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { Platform, ScrollView, View, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { MaxWidthContainer } from "./MaxWidthContainer";

interface WebLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  /** Disable max-width constraints (for full-width layouts) */
  fullWidth?: boolean;
}

export function WebLayout({
  children,
  showSidebar = false,
  sidebarContent,
  fullWidth = false,
}: WebLayoutProps) {
  const layout = useResponsiveLayout();
  const { styles } = useStyles(stylesheet);

  // On mobile or when sidebar is disabled, just return children with max-width
  if (!layout.isWeb || layout.isMobile || !showSidebar) {
    return (
      <View style={styles.container as ViewStyle}>
        <MaxWidthContainer fullWidth={fullWidth}>{children}</MaxWidthContainer>
      </View>
    );
  }

  // Desktop/tablet layout with sidebar
  return (
    <View style={styles.container as ViewStyle}>
      <MaxWidthContainer fullWidth={fullWidth}>
        <View style={styles.webLayout as ViewStyle}>
          {sidebarContent && (
            <View style={styles.sidebar as ViewStyle}>
              <ScrollView
                contentContainerStyle={styles.sidebarContent as ViewStyle}
                showsVerticalScrollIndicator={false}
              >
                {sidebarContent}
              </ScrollView>
            </View>
          )}
          <View style={styles.mainContent as ViewStyle}>{children}</View>
        </View>
      </MaxWidthContainer>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webLayout: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    backgroundColor: theme.colors.background,
    borderRightColor: theme.colors.border,
    ...Platform.select({
      web: {
        position: "sticky" as any,
        top: 0,
        height: "100vh" as any,
      },
    }),
  },
  sidebarContent: {
    padding: spacing.xl,
  },
  mainContent: {
    flex: 1,
  },
}));
