import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NavItem {
  name: string;
  icon: string;
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'dashboard', icon: 'house.fill', path: '/', label: 'Dashboard' },
  { name: 'vehicles', icon: 'car.fill', path: '/vehicles', label: 'Vehicles' },
  { name: 'logs', icon: 'doc.text.fill', path: '/logs', label: 'Logs' },
  { name: 'groups', icon: 'person.3.fill', path: '/groups', label: 'Groups' },
  { name: 'profile', icon: 'person.fill', path: '/profile', label: 'Profile' },
];

export function WebSidebar() {
  const layout = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Only render on web and larger screens
  if (!layout.isWeb || layout.isMobile) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

    return (
      <TouchableOpacity
        style={[
          styles.navButton,
          {
            backgroundColor: isActive ? colors.tint : 'transparent',
          }
        ]}
        onPress={() => router.push(item.path as any)}
      >
        <IconSymbol
          name={item.icon}
          size={20}
          color={isActive ? 'white' : colors.text}
        />
        <Text
          style={[
            styles.navButtonText,
            {
              color: isActive ? 'white' : colors.text,
            }
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    sidebar: {
      width: 240,
      height: '100%',
      backgroundColor: colors.background,
      borderRightWidth: 1,
      borderRightColor: colors.icon + '20',
      paddingVertical: 24,
      paddingHorizontal: 16,
      ...Platform.select({
        web: {
          position: 'fixed' as any,
          left: 0,
          top: 0,
          zIndex: 100,
        },
      }),
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    brandText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    nav: {
      flex: 1,
      gap: 4,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 12,
    },
    navButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    userSection: {
      borderTopWidth: 1,
      borderTopColor: colors.icon + '20',
      paddingTop: 16,
      gap: 16,
    },
    userInfo: {
      paddingHorizontal: 8,
    },
    userName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 12,
      color: colors.icon,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#ff4444',
      gap: 8,
      justifyContent: 'center',
    },
    signOutText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <IconSymbol name="car.fill" size={24} color={colors.tint} />
        <Text style={styles.brandText}>Vehicle Manager</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol name="arrow.right.square" size={16} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}