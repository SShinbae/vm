import { IconSymbol } from "@/components/ui/icon-symbol";
import { ActivityItem } from "@/hooks/useDashboardData"; // Or from your types file
import { formatRelativeTime, getActivityColor } from "@/utils/format";
import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type ActivityTimelineItemProps = {
  item: ActivityItem;
};

export function ActivityTimelineItem({ item }: ActivityTimelineItemProps) {
  const { styles, theme } = useStyles(stylesheet);
  const color = getActivityColor(item.type, theme);

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={item.icon as any} size={20} color={color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityVehicle} numberOfLines={1}>
          {item.vehicleName}
        </Text>
        <Text style={styles.activityValue}>{item.primaryValue}</Text>
        <Text style={styles.activityTime}>
          {formatRelativeTime(item.date)}
        </Text>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  activityVehicle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  activityValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
}));