import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { router, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, initialized, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (!initialized || loading) return;

    const segmentPath = segments.join("/");
    const inAuthGroup = segments[0] === "(auth)";
    const inRootIndex =
      !segmentPath || segmentPath === "" || segmentPath === "index";
    const inResetPassword = segmentPath === "(auth)/reset-password";

    // If in password recovery mode, redirect to reset-password page
    if (isPasswordRecovery && user && !inResetPassword) {
      router.replace("/(auth)/reset-password");
      return;
    }

    if (!user && !inAuthGroup && !inRootIndex) {
      // Redirect to root/landing if user is not authenticated and not in auth group or root
      router.replace("/");
    } else if (user && inAuthGroup && !isPasswordRecovery) {
      // Redirect to main app if user is authenticated and in auth group (but not during password recovery)
      router.replace("/(tabs)");
    }
  }, [user, segments, initialized, loading, isPasswordRecovery]);

  // Show loading screen while initializing
  if (!initialized || loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
