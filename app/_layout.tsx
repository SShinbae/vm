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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { toastConfig } from "@/components/ui/ToastConfig";
import "../unistyles";

import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { DialogProvider } from "@/lib/contexts/DialogContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { oneSignalService } from "@/lib/services/oneSignalService";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Initialize OneSignal for push notifications (all platforms)
oneSignalService.initialize();

// Removed unstable_settings to allow index.tsx to control default route

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <DialogProvider>
              <RootLayoutContent />
            </DialogProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="vehicles" options={{ headerShown: false }} />
              <Stack.Screen name="logs" options={{ headerShown: false }} />
              <Stack.Screen name="groups" options={{ headerShown: false }} />
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
        <Toast config={toastConfig} position="top" topOffset={0} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
