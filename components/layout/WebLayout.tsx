import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { Platform, ScrollView, View, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface WebLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

export function WebLayout({
  children,
  showSidebar = false,
  sidebarContent,
}: WebLayoutProps) {
  const layout = useResponsiveLayout();
  const { styles } = useStyles(stylesheet);

  // On mobile or when sidebar is disabled, just return children
  if (!layout.isWeb || layout.isMobile || !showSidebar) {
    return (
      <View style={styles.container as ViewStyle}>
        <View
          style={[
            styles.content as ViewStyle,
            {
              maxWidth: layout.maxContentWidth,
              paddingHorizontal: layout.contentPadding,
            },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  // Desktop/tablet layout with sidebar
  return (
    <View style={styles.container as ViewStyle}>
      <View
        style={[
          styles.webLayout as ViewStyle,
          { maxWidth: layout.maxContentWidth },
        ]}
      >
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
        <View
          style={[
            styles.mainContent as ViewStyle,
            { paddingHorizontal: layout.contentPadding },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  webLayout: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    alignSelf: "center",
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
    padding: 20,
  },
  mainContent: {
    flex: 1,
  },
}));
