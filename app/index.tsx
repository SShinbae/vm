import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Image } from "expo-image";

export default function Index() {
  const { user, loading, initialized } = useAuth();
  const { theme } = useStyles();

  // Show loading spinner while checking authentication
  if (!initialized || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Image
          source={require("@/assets/images/vm_logo.png")} // or your logo path
          style={{ width: 120, height: 120, marginBottom: 20 }}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Redirect based on authentication state
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
