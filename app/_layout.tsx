import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useCallback } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { DialogProvider } from '@/lib/contexts/DialogContext';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationManager } from '@/components/ui/NotificationManager';
import '@/lib/utils/testSupabase';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
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
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NotificationProvider>
          <DialogProvider>
            <AuthGuard>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen
                  name="notifications"
                  options={{
                    presentation: 'modal',
                    headerShown: false
                  }}
                />
              </Stack>
              <NotificationManager />
            </AuthGuard>
          </DialogProvider>
        </NotificationProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}
