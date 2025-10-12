import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebSidebar } from '@/components/navigation/WebSidebar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const layout = useResponsiveLayout();
  const { toggle, isOpen } = useSidebar();

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: toggle,
  });

  // Hide tab bar on web desktop, show WebSidebar instead
  const showTabBar = !layout.isWeb || layout.isMobile;

  return (
    <View style={styles.container}>
      {/* Sidebar for web desktop only */}
      {Platform.OS === 'web' && !layout.isMobile && <WebSidebar />}
      
      {/* Main content area with responsive margin for sidebar */}
      <View
        style={[
          styles.content,
          // Desktop web: add margin for sidebar
          Platform.OS === 'web' && !layout.isMobile && {
            marginLeft: isOpen ? 240 : 60,
          },
          // Mobile web: add bottom padding for tab bar
          Platform.OS === 'web' && layout.isMobile && {
            paddingBottom: 110, // Space for larger bottom tab bar on mobile web
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          }
        ]}
      >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].icon,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarShowLabel: true, // Explicitly show labels
            tabBarLabelStyle: {
              fontSize: Platform.OS === 'web' && layout.isMobile ? 13 : 11,
              fontWeight: '600',
              marginTop: Platform.OS === 'web' && layout.isMobile ? 2 : -2,
              marginBottom: Platform.OS === 'web' && layout.isMobile ? 4 : 2,
              textAlign: 'center',
            } as any, // Type assertion for web-specific properties
            // Force labels to show on mobile web
            tabBarHideOnKeyboard: false,
            tabBarVisibilityAnimationConfig: {
              show: { animation: 'timing', config: { duration: 200 } },
              hide: { animation: 'timing', config: { duration: 200 } },
            },
            tabBarStyle: showTabBar ? {
              backgroundColor: 'transparent',
              borderTopColor: 'transparent',
              borderTopWidth: 0,
              height: Platform.OS === 'web' && layout.isMobile ? 90 : 70,
              paddingBottom: Platform.OS === 'web' && layout.isMobile ? 20 : 12,
              paddingTop: 12,
              paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
              ...Platform.select({
                web: layout.isMobile ? {
                  position: 'fixed' as any,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: colorScheme === 'dark'
                    ? 'rgba(24, 24, 27, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px 16px 0 0',
                } : undefined,
              }),
            } : { display: 'none' },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="vehicles"
            options={{
              title: 'Vehicles',
              tabBarLabel: 'Vehicles',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="car.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarLabel: 'Analytics',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="chart.line.uptrend.xyaxis" color={color} />,
            }}
          />
          <Tabs.Screen
            name="logs"
            options={{
              title: 'Logs',
              tabBarLabel: 'Logs',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="doc.text.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="groups"
            options={{
              title: 'Groups',
              tabBarLabel: 'Groups',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="person.3.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'web' && layout.isMobile ? 32 : 28} name="person.fill" color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <SidebarProvider>
      <TabLayoutContent />
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        transition: 'margin-left 0.3s ease',
      },
    }),
  },
});
