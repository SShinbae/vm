import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { WebSidebar } from "@/components/navigation/WebSidebar";
import { WebPageHeader } from "./WebPageHeader";

export function DashboardWebLayout({
  children,
  showHeader = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  const { theme } = useStyles();
  const layout = useResponsiveLayout();
  const { isOpen, toggle } = useSidebar();
  const isFocused = useIsFocused();
  const isWeb = layout.isWeb && !layout.isMobile;
  useKeyboardShortcuts({
    onToggleSidebar: toggle,
    enabled: isWeb && isFocused,
  });

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {isWeb && <WebSidebar />}
      <View
        style={[
          styles.content,
          { backgroundColor: theme.colors.background },
          isWeb && { marginLeft: isOpen ? 240 : 96 },
        ]}
      >
        {isWeb && showHeader && <WebPageHeader />}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    minWidth: 0,
    ...Platform.select({ web: { transition: "margin-left 0.3s ease" } }),
  },
});
