import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { LinearGradient } from "expo-linear-gradient";

import type { SFSymbols6_0 } from "sf-symbols-typescript";

interface TrendCardProps {
  title: string;
  value: string;
  trend: number;
  subtitle?: string;
  icon?: SFSymbols6_0;
  gradientColors?: readonly [string, string];
  onPress?: () => void;
}

export function TrendCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  gradientColors,
  onPress,
}: TrendCardProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const defaultGradient = gradientColors || [colors.primary, colors.secondary];

  const styles = StyleSheet.create({
    container: {
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: theme.colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    card: {
      padding: spacing.xl,
      minHeight: 120,
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withOpacity(baseColors.white, 0.2),
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: withOpacity(baseColors.white, 0.9),
      flex: 1,
    },
    valueContainer: {
      marginBottom: spacing.md,
    },
    value: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.colors.white,
      lineHeight: 34,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: withOpacity(baseColors.white, 0.15),
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
    },
    trendText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.white,
    },
    subtitle: {
      fontSize: 12,
      color: withOpacity(baseColors.white, 0.7),
    },
  });

  const getTrendIcon = (trend: number) => {
    if (trend === 0) return "minus";
    return trend > 0 ? "arrow.up.right" : "arrow.down.right";
  };

  const renderCard = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {icon && (
              <View style={styles.iconContainer}>
                <IconSymbol
                  name={icon as any}
                  size={20}
                  color={theme.colors.white}
                />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.trendContainer}>
            <IconSymbol
              name={getTrendIcon(trend)}
              size={12}
              color={theme.colors.white}
            />
            <Text style={styles.trendText}>{Math.abs(trend).toFixed(1)}%</Text>
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.cardPressed}
      >
        {renderCard()}
      </TouchableOpacity>
    );
  }

  return renderCard();
}
