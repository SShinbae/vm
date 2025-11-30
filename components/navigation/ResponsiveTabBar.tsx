import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import {
  Animated,
  PixelRatio,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface TabBarBadgeProps {
  count?: number;
}

const TabBarBadge: React.FC<TabBarBadgeProps> = ({ count }) => {
  const { styles, theme } = useStyles(stylesheet);

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

  // Active indicator position animation
  const activeX = React.useRef(new Animated.Value(0)).current;

  // Active indicator opacity animation
  const activeIndicatorOpacity = React.useRef(new Animated.Value(1)).current;

  // Store layout measurements for each tab
  const tabLayoutsRef = React.useRef<
    Record<string, { x: number; width: number }>
  >({});

  // State for pill width
  const [pillWidth, setPillWidth] = React.useState(0);

  // Determine if we're on mobile or tablet/desktop
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const activeIconSize = isMobile ? 28 : 32;
  const inactiveIconSize = isMobile ? 24 : 28;

  // Animate to the visible index whenever the active tab changes
  useEffect(() => {
    const activeRoute = state.routes[state.index];
    const cell = tabLayoutsRef.current[activeRoute.key];

    if (!cell) return;

    // Calculate inner content width (exclude button padding)
    // Use the button's actual width (already measured)
    const targetPillWidth = Math.max(0, cell.width * 0.85); // 85% of button width for tighter fit

    // Center the pill on the tab's center
    const center = cell.x + cell.width / 2;
    const targetX = PixelRatio.roundToNearestPixel(
      center - targetPillWidth / 2,
    );

    // Set width
    setPillWidth(targetPillWidth);

    // Animate X position
    Animated.spring(activeX, {
      toValue: targetX,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [state.index, visibleRoutes.length]);

  const handlePress = (route: any, index: number, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // Enhanced haptic feedback - medium impact
      if (Platform.OS === "ios" || Platform.OS === "android") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Enhanced spring animation with bounce
      Animated.spring(scaleAnims[index], {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }).start(() => {
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
          tension: 40,
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
        {/* Animated Active Indicator Pill */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: pillWidth,
              transform: [{ translateX: activeX }],
              opacity: activeIndicatorOpacity,
            },
          ]}
        />

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
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayoutsRef.current[route.key] = { x, width };
              }}
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
                style={styles.tabButton}
              >
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
                {isFocused && (
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: theme.colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {typeof label === "string" ? label : "Tab"}
                  </Text>
                )}
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
    backgroundColor: theme.colors.gray[100] + "F0",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border + "40",
    overflow: "hidden",
    variants: {
      breakpoint: {
        xs: { height: 58, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        sm: { height: 58, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        md: { height: 66, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
        lg: { height: 66, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
        xl: { height: 66, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
      },
    },
  },

  activeIndicator: {
    position: "absolute",
    height: "75%",
    top: "12.5%",
    backgroundColor: theme.colors.primary + "18", // 10% opacity
    borderRadius: 14,
    zIndex: 0,
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
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    variants: {
      breakpoint: {
        xs: {
          fontSize: 10,
        },
        sm: {
          fontSize: 10,
        },
        md: {
          fontSize: 11,
        },
        lg: {
          fontSize: 11,
        },
        xl: {
          fontSize: 11,
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
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },
}));
