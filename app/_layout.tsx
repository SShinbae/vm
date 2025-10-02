import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { AuthGuard } from '@/components/AuthGuard';
import { WebSidebar } from '@/components/navigation/WebSidebar';
import { NotificationManager } from '@/components/ui/NotificationManager';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { DialogProvider } from '@/lib/contexts/DialogContext';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
// import '@/lib/utils/testSupabase'; // Disabled - causing Metro bundling errors

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
      {Platform.OS === 'web' && (
        <Head>
          <title>Vehicle Management</title>
        </Head>
      )}
      <AuthProvider>
        <NotificationProvider>
          <DialogProvider>
            <SidebarProvider>
              <AuthGuard>
                <AppLayoutWithSidebar />
                <NotificationManager />
              </AuthGuard>
            </SidebarProvider>
          </DialogProvider>
        </NotificationProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

// Separate component to use sidebar context
function AppLayoutWithSidebar() {
  const layout = useResponsiveLayout();
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  // Hide sidebar on auth pages (login, register)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/(auth)');

  // Calculate sidebar width based on state - no margin on auth pages
  const sidebarWidth = layout.isWeb && !layout.isMobile && !isAuthPage ? (isOpen ? 240 : 60) : 0;

  return (
    <View style={{ flex: 1, flexDirection: layout.isWeb && !layout.isMobile ? 'row' : 'column' }}>
      <WebSidebar />
      <View style={{
        flex: 1,
        marginLeft: sidebarWidth,
        ...(Platform.OS === 'web' && {
          // @ts-ignore - web-specific class
          className: 'content-transition',
        }),
      }}>
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
      </View>
    </View>
  );
}
