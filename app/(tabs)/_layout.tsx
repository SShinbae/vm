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
      {/* Sidebar for web */}
      {Platform.OS === 'web' && <WebSidebar />}
      
      {/* Main content area with responsive margin for sidebar */}
      <View 
        style={[
          styles.content,
          Platform.OS === 'web' && layout.isWeb && !layout.isMobile && {
            marginLeft: isOpen ? 240 : 60,
          }
        ]}
      >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: showTabBar ? undefined : { display: 'none' },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="vehicles"
            options={{
              title: 'Vehicles',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
            }}
          />
          <Tabs.Screen
            name="logs"
            options={{
              title: 'Logs',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="groups"
            options={{
              title: 'Groups',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
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
