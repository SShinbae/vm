import { IconSymbol } from '@/components/ui/icon-symbol';
import { ConfirmModal } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NavItem {
  name: string;
  icon: string;
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'dashboard', icon: 'house.fill', path: '/', label: 'Dashboard' },
  { name: 'vehicles', icon: 'car.fill', path: '/vehicles', label: 'Vehicles' },
  { name: 'analytics', icon: 'chart.line.uptrend.xyaxis', path: '/analytics', label: 'Analytics' },
  { name: 'logs', icon: 'doc.text.fill', path: '/logs', label: 'Logs' },
  { name: 'groups', icon: 'person.3.fill', path: '/groups', label: 'Groups' },
];

export function WebSidebar() {
  const layout = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Hide sidebar on auth pages (login, register)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/(auth)');

  // Only render on web, and not on auth pages
  if (!layout.isWeb || isAuthPage) {
    return null;
  }

  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/login');
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

    return (
      <Tooltip 
        content={item.label} 
        position="right" 
        disabled={isOpen} // Only show tooltip when sidebar is collapsed
      >
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: isActive ? colors.tint : 'transparent',
              justifyContent: isOpen ? 'flex-start' : 'center',
              paddingHorizontal: isOpen ? 16 : 12,
            },
            Platform.OS === 'web' && {
              // @ts-ignore - web-specific class
              className: 'nav-item-transition',
            }
          ]}
          onPress={() => router.push(item.path as any)}
        >
          <IconSymbol
            name={item.icon as any}
            size={20}
            color={isActive ? 'white' : colors.text}
          />
          {isOpen && (
            <Text
              style={[
                styles.navButtonText,
                {
                  color: isActive ? 'white' : colors.text,
                },
                Platform.OS === 'web' && {
                  // @ts-ignore - web-specific class
                  className: 'text-fade-transition',
                }
              ]}
            >
              {item.label}
            </Text>
          )}
        </TouchableOpacity>
      </Tooltip>
    );
  };

  const styles = StyleSheet.create({
    sidebar: {
      width: isOpen ? 240 : 60,
      height: '100%',
      backgroundColor: colors.background,
      borderRightWidth: 1,
      borderRightColor: colors.icon + '20',
      paddingVertical: 24,
      paddingHorizontal: isOpen ? 16 : 8,
      ...Platform.select({
        web: {
          position: 'fixed' as any,
          left: 0,
          top: 0,
          zIndex: 100,
          // @ts-ignore - web-specific class
          className: 'sidebar-transition',
        },
      }),
    },
    toggleButton: {
      position: 'absolute',
      top: 36, // Align with "Vehicle Manager" text
      right: -15,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          zIndex: 101,
          // @ts-ignore - web-specific class
          className: 'toggle-button-transition',
        },
      }),
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: isOpen ? 8 : 0,
      justifyContent: isOpen ? 'flex-start' : 'center',
      paddingVertical: 8,
      borderRadius: 8,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: 'nav-item-transition',
        },
      }),
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
      gap: 12,
    },
    signOutButtonContainer: {
      paddingHorizontal: isOpen ? 8 : 0,
      alignItems: 'center',
    },
    signOutButton: {
      width: isOpen ? '100%' : 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#ff4444',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: 'toggle-button-transition',
        },
      }),
    },
    signOutText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    userInfo: {
      paddingHorizontal: isOpen ? 8 : 0,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    },
    userAvatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: isOpen ? '100%' : undefined,
      justifyContent: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    userDetails: {
      flex: 1,
      minWidth: 0,
      alignItems: isOpen ? 'flex-start' : 'center',
    },
    userName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
      ...Platform.select({
        web: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        },
      }),
    },
    userEmail: {
      fontSize: 12,
      color: colors.icon,
      ...Platform.select({
        web: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        },
      }),
    },
  });

  return (
    <View style={styles.sidebar}>
      {/* Toggle Button */}
      <Tooltip 
        content={`${isOpen ? 'Collapse' : 'Expand'} sidebar (Ctrl+B)`} 
        position="right"
      >
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={toggle}
          activeOpacity={0.7}
        >
          <IconSymbol 
            name={isOpen ? "chevron.left" : "chevron.right"} 
            size={16} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </Tooltip>

      {/* Brand Section */}
      <Tooltip 
        content="Vehicle Manager" 
        position="right" 
        disabled={isOpen}
      >
        <View style={styles.brand}>
          <IconSymbol name="car.fill" size={24} color={colors.tint} />
          {isOpen && (
            <Text 
              style={[
                styles.brandText,
                Platform.OS === 'web' && {
                  // @ts-ignore - web-specific class
                  className: 'text-fade-transition',
                }
              ]}
            >
              Vehicle Manager
            </Text>
          )}
        </View>
      </Tooltip>

      {/* Navigation */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        {/* Sign Out Button */}
        <View style={styles.signOutButtonContainer}>
          <Tooltip
            content="Sign Out"
            position="right"
            disabled={isOpen}
          >
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOutClick}
              activeOpacity={0.8}
            >
              <IconSymbol name="arrow.right.square" size={14} color="white" />
              {isOpen && (
                <Text
                  style={[
                    styles.signOutText,
                    Platform.OS === 'web' && {
                      // @ts-ignore - web-specific class
                      className: 'text-fade-transition',
                    }
                  ]}
                >
                  Sign Out
                </Text>
              )}
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* User Info */}
        <Tooltip
          content="Profile"
          position="right"
          disabled={isOpen}
        >
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push('/profile' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.userAvatarRow}>
              {/* Avatar */}
              <View style={styles.avatar}>
                {user?.profile?.avatar_url ? (
                  <Image
                    source={{ uri: user.profile.avatar_url }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <IconSymbol name="person.fill" size={16} color={colors.tint} />
                )}
              </View>

              {/* User Details - only show when expanded */}
              {isOpen && (
                <View
                  style={[
                    styles.userDetails,
                    Platform.OS === 'web' && {
                      // @ts-ignore - web-specific class
                      className: 'text-fade-transition',
                    }
                  ]}
                >
                  <Text style={styles.userName}>{user?.profile?.username || user?.email?.split('@')[0]}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Tooltip>
      </View>

      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
    </View>
  );
}