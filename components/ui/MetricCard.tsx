import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { IconSymbol } from "./icon-symbol";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
}

export function MetricCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  color,
  onPress,
  size = "medium",
}: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const cardColor = color || colors.tint;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: size === "large" ? 20 : 16,
      padding: size === "large" ? 24 : size === "medium" ? 20 : 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      minHeight: size === "large" ? 160 : size === "medium" ? 120 : 100,
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.05,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: size === "large" ? 16 : 12,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    iconContainer: {
      width: size === "large" ? 48 : size === "medium" ? 40 : 32,
      height: size === "large" ? 48 : size === "medium" ? 40 : 32,
      borderRadius: size === "large" ? 24 : size === "medium" ? 20 : 16,
      backgroundColor: cardColor + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: size === "large" ? 16 : size === "medium" ? 14 : 12,
      fontWeight: "600",
      color: colors.textSecondary,
      flex: 1,
    },
    valueContainer: {
      marginBottom: size === "large" ? 12 : 8,
    },
    value: {
      fontSize: size === "large" ? 36 : size === "medium" ? 28 : 24,
      fontWeight: "700",
      color: colors.text,
      lineHeight: size === "large" ? 42 : size === "medium" ? 34 : 28,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    trendText: {
      fontSize: size === "large" ? 14 : 12,
      fontWeight: "600",
    },
    trendPositive: {
      color: colors.success,
    },
    trendNegative: {
      color: colors.error,
    },
    trendNeutral: {
      color: colors.textSecondary,
    },
    subtitle: {
      fontSize: size === "large" ? 14 : 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    footer: {
      marginTop: "auto",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });

  const getTrendColor = (trend?: number) => {
    if (trend === undefined || trend === 0) return styles.trendNeutral;
    return trend > 0 ? styles.trendPositive : styles.trendNegative;
  };

  const getTrendIcon = (trend?: number) => {
    if (trend === undefined || trend === 0) return "minus";
    return trend > 0 ? "arrow.up.right" : "arrow.down.right";
  };

  const renderCard = () => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && (
            <View style={styles.iconContainer}>
              <IconSymbol
                name={icon}
                size={size === "large" ? 24 : size === "medium" ? 20 : 16}
                color={cardColor}
              />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {trend !== undefined && (
        <View style={styles.footer}>
          <View style={styles.trendContainer}>
            <IconSymbol
              name={getTrendIcon(trend)}
              size={size === "large" ? 16 : 14}
              color={
                trend > 0
                  ? colors.success
                  : trend < 0
                    ? colors.error
                    : colors.textSecondary
              }
            />
            <Text style={[styles.trendText, getTrendColor(trend)]}>
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
          <Text style={[styles.subtitle, { marginTop: 0 }]}>vs last month</Text>
        </View>
      )}
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
