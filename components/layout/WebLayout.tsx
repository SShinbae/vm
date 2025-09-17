import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WebLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

export function WebLayout({ children, showSidebar = false, sidebarContent }: WebLayoutProps) {
  const layout = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // On mobile or when sidebar is disabled, just return children
  if (!layout.isWeb || layout.isMobile || !showSidebar) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[
          styles.content,
          {
            maxWidth: layout.maxContentWidth,
            paddingHorizontal: layout.contentPadding,
          }
        ]}>
          {children}
        </View>
      </View>
    );
  }

  // Desktop/tablet layout with sidebar
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.webLayout, { maxWidth: layout.maxContentWidth }]}>
        {sidebarContent && (
          <View style={[
            styles.sidebar,
            {
              backgroundColor: colors.background,
              borderRightColor: colors.icon + '20',
            }
          ]}>
            <ScrollView
              contentContainerStyle={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {sidebarContent}
            </ScrollView>
          </View>
        )}
        <View style={[
          styles.mainContent,
          { paddingHorizontal: layout.contentPadding }
        ]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  webLayout: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        height: '100vh',
      },
    }),
  },
  sidebarContent: {
    padding: 20,
  },
  mainContent: {
    flex: 1,
  },
});