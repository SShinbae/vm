import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { Platform, View } from "react-native";
import "react-native-reanimated";
import "../unistyles";

import { AuthGuard } from "@/components/AuthGuard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { DialogProvider } from "@/lib/contexts/DialogContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Removed unstable_settings to allow index.tsx to control default route

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DialogProvider>
            <RootLayoutContent />
          </DialogProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  // Preload fonts (if you add custom fonts, they'll be loaded here)
  const [fontsLoaded, fontError] = useFonts({
    // Add custom fonts here if needed
    // 'CustomFont': require('../assets/fonts/CustomFont.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there's an error
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      onLayoutRootView();
    }
  }, [fontsLoaded, fontError, onLayoutRootView]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {Platform.OS === "web" && (
        <Head>
          <title>Vehicle Management</title>
        </Head>
      )}
      <AuthGuard>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </AuthGuard>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}
