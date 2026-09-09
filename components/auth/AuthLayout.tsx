import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { ReactNode } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

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
      flex: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: "center",
      maxWidth: screenWidth > 768 ? 450 : ("100%" as any),
      alignSelf: "center",
      width: "100%",
      paddingVertical: spacing.xxxl,
    },
  });

  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {scrollable ? (
          <ScrollView
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
