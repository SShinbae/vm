import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Easing,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, animated]);

  const backgroundColor = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.icon + '20', colors.icon + '40'],
      })
    : colors.icon + '20';

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  style,
}: {
  showAvatar?: boolean;
  lines?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardContent}>
        {showAvatar && (
          <View style={styles.avatarRow}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.avatarText}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
          </View>
        )}

        <View style={styles.textLines}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? '70%' : '100%'}
              height={14}
              style={{ marginBottom: 8 }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({
  itemCount = 5,
  showAvatar = false,
  lines = 2,
}: {
  itemCount?: number;
  showAvatar?: boolean;
  lines?: number;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={showAvatar}
          lines={lines}
          style={{ marginBottom: 12 }}
        />
      ))}
    </View>
  );
}

export function SkeletonButton({
  width = 120,
  height = 40,
  style,
}: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={8}
      style={style}
    />
  );
}

export function SkeletonHeader({
  showBackButton = true,
  showActions = true,
  style,
}: {
  showBackButton?: boolean;
  showActions?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]}>
      {showBackButton && (
        <Skeleton width={24} height={24} borderRadius={4} />
      )}
      <Skeleton width="40%" height={24} style={{ marginLeft: showBackButton ? 16 : 0 }} />
      <View style={styles.spacer} />
      {showActions && (
        <View style={styles.headerActions}>
          <Skeleton width={60} height={32} borderRadius={6} />
        </View>
      )}
    </View>
  );
}

export function SkeletonStats({
  count = 3,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.stats, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.statItem}>
          <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    // Base skeleton styles are handled by the component
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  cardContent: {
    // Card content container
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    flex: 1,
    marginLeft: 12,
  },
  textLines: {
    // Text lines container
  },
  list: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  spacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
});