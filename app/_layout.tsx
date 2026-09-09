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
import Toast from "react-native-toast-message";

import { toastConfig } from "@/components/ui/ToastConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Import unistyles - theme configuration (already wrapped in try-catch in unistyles.ts)
import "../unistyles";

import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { DemoProvider } from "@/lib/contexts/DemoContext";
import { DialogProvider } from "@/lib/contexts/DialogContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { PostHogProvider } from "@/lib/providers/PostHogProvider";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { registerBackgroundTask } from "@/lib/tasks/backgroundTasks";

// Import reanimated - required for gesture handler and animations
// This import must happen before any other imports that use reanimated
try {
  require("react-native-reanimated"); // eslint-disable-line @typescript-eslint/no-require-imports
} catch (error) {
  // Silent fail in production - reanimated might not be available
  if (__DEV__) {
    console.error("Failed to load react-native-reanimated:", error);
  }
}
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// OneSignal initialization is now deferred to prevent blocking initial render
// See: lib/services/oneSignalLazy.ts and lib/contexts/AuthContext.tsx

// Removed unstable_settings to allow index.tsx to control default route

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <PostHogProvider>
          <ThemeProvider>
            <DemoProvider>
              <AuthProvider>
                <NotificationProvider>
                  <DialogProvider>
                    <RootLayoutContent />
                  </DialogProvider>
                </NotificationProvider>
              </AuthProvider>
            </DemoProvider>
          </ThemeProvider>
        </PostHogProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  // OPTIMIZATION: Register service worker for asset caching (web only)
  useEffect(() => {
    if (Platform.OS === "web" && "serviceWorker" in navigator) {
      // Only register in production
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/service-worker.js", { scope: "/" })
          .then((registration) => {
            // Check for updates on load
            registration.update();
          })
          .catch(() => {
            // Silent fail in production
          });
      }
    }
  }, []);

  // Register background tasks on mobile after auth init
  useEffect(() => {
    if (Platform.OS !== "web") {
      registerBackgroundTask();
    }
  }, []);

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
            <meta
              name="description"
              content="Track expenses, monitor mileage, analyze fuel consumption, and generate comprehensive reports for your vehicles — all in one powerful platform."
            />
            {/* Resource hints for performance optimization */}
            <link rel="dns-prefetch" href="https://supabase.co" />
            <link
              rel="preconnect"
              href={process.env.EXPO_PUBLIC_SUPABASE_URL || ""}
            />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, viewport-fit=cover"
            />
            {/* Performance optimization meta tags */}
            <meta httpEquiv="x-dns-prefetch-control" content="on" />
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
            </Stack>
          </View>
        </AuthGuard>
        <StatusBar style="auto" />
        <Toast config={toastConfig} position="top" topOffset={0} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
