import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
      paddingHorizontal: 24,
      justifyContent: "center",
      maxWidth: screenWidth > 768 ? 450 : ("100%" as any),
      alignSelf: "center",
      width: "100%",
      paddingVertical: 40,
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
