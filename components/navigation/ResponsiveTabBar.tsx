import { withOpacity, spacing } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface TabBarBadgeProps {
  count?: number;
}

const TabBarBadge: React.FC<TabBarBadgeProps> = ({ count }) => {
  const { styles } = useStyles(stylesheet);

  if (!count || count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

export const ResponsiveTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { styles, theme, breakpoint } = useStyles(stylesheet);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const visibleRoutes = React.useMemo(
    () =>
      state.routes.filter((route) => {
        const { options } = descriptors[route.key];
        const hasHref = "href" in (options as any);
        if (hasHref && (options as any).href === null) {
          return false;
        }
        return true;
      }),
    [descriptors, state.routes],
  );

  // Animation scale for press effect
  const scaleAnims = React.useRef(
    state.routes.map(() => new Animated.Value(1)),
  ).current;

  // Determine if we're on mobile or tablet/desktop
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const activeIconSize = isMobile ? 22 : 24;
  const inactiveIconSize = isMobile ? 20 : 22;

  const handlePress = (route: any, index: number, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // Subtle haptic feedback - light impact for corporate feel
      if (Platform.OS === "ios" || Platform.OS === "android") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Subtle spring animation
      if (reduceMotion) {
        navigation.navigate(route.name, route.params);
        return;
      }

      Animated.spring(scaleAnims[index], {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 5,
        tension: 50,
      }).start(() => {
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 50,
        }).start();
      });

      navigation.navigate(route.name, route.params);
    }
  };

  const handleLongPress = (route: any) => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 0),
        },
      ]}
    >
      <View style={styles.tabBar}>
        {visibleRoutes.map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const iconColor = isFocused
            ? theme.colors.primary
            : theme.colors.textSecondary;

          const currentIconSize = isFocused ? activeIconSize : inactiveIconSize;

          // Get badge count from options if available
          const badgeCount = options.tabBarBadge as number | undefined;

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabItem,
                {
                  transform: [{ scale: scaleAnims[routeIndex] }],
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={
                  typeof label === "string"
                    ? `${label} tab${isFocused ? ", active" : ""}`
                    : undefined
                }
                testID={options.tabBarAccessibilityLabel}
                onPress={() => handlePress(route, routeIndex, isFocused)}
                onLongPress={() => handleLongPress(route)}
                style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              >
                {/* Top accent line for active tab - centered within button */}
                {isFocused && <View style={styles.activeIndicatorLine} />}
                <View style={styles.iconContainer}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: iconColor,
                    size: currentIconSize,
                  })}
                  {badgeCount !== undefined && (
                    <TabBarBadge count={badgeCount} />
                  )}
                </View>
                {/* Always show labels for corporate clarity */}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                      fontWeight: isFocused ? "600" : "500",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {typeof label === "string" ? label : "Tab"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const stylesheet = createStyleSheet((theme, runtime) => ({
  tabBarContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },

  tabBar: {
    flexDirection: "row",
    position: "relative",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    overflow: "hidden",
    variants: {
      breakpoint: {
        xs: { height: 64 },
        sm: { height: 64 },
        md: { height: 72 },
        lg: { height: 72 },
        xl: { height: 72 },
      },
    },
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    minHeight: 48,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: spacing.xs,
    borderRadius: theme.borderRadius.md,
  },

  tabButtonActive: {
    backgroundColor: withOpacity(theme.colors.primary, 0.08), // 8% opacity
  },

  activeIndicatorLine: {
    position: "absolute",
    top: -4,
    width: "50%",
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },

  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.xs,
    variants: {
      breakpoint: {
        xs: {
          fontSize: 11,
        },
        sm: {
          fontSize: 11,
        },
        md: {
          fontSize: 12,
        },
        lg: {
          fontSize: 12,
        },
        xl: {
          fontSize: 12,
        },
      },
    },
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.background,
  },

  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },
}));
