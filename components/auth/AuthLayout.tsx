import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { ReactNode } from "react";
import {
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
}

/**
 * AuthLayout - Consistent wrapper for all auth pages
 *
 * Provides:
 * - SafeAreaView with theme background
 * - KeyboardAvoidingView (iOS padding behavior)
 * - Optional ScrollView with centered content
 * - Responsive maxWidth (450px on tablet)
 * - Consistent padding
 */
export function AuthLayout({ children, scrollable = true }: AuthLayoutProps) {
  const { theme } = useStyles();
  const colors = theme.colors;
  const { width } = useWindowDimensions();
  const compact = Platform.OS !== "web" || width < 768;

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: compact ? 16 : spacing.xl,
      justifyContent: compact ? "flex-start" : "center",
      maxWidth: compact ? "100%" : 450,
      alignSelf: "center",
      width: "100%",
      paddingTop: compact ? 24 : spacing.xxxl,
      paddingBottom: 32,
    },
  });

  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        enabled={Platform.OS !== "web"}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {scrollable ? (
          <ScrollView
            style={{ flex: 1 }}
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
