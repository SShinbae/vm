import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebSidebar } from '@/components/navigation/WebSidebar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const layout = useResponsiveLayout();

  // Hide tab bar on web desktop, show WebSidebar instead
  const showTabBar = !layout.isWeb || layout.isMobile;

  return (
    <View style={{ flex: 1, flexDirection: layout.isWeb && !layout.isMobile ? 'row' : 'column' }}>
      <WebSidebar />
      <View style={{
        flex: 1,
        marginLeft: layout.isWeb && !layout.isMobile ? 240 : 0
      }}>
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
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
