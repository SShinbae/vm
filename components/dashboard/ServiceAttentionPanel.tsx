import { ServiceReminder } from "@/lib/dashboard/serviceReminders";
import { formatServiceType } from "@/lib/utils/serviceUtils";
import { withOpacity } from "@/src/design-system";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type Props = {
  reminders: ServiceReminder[];
};

export function ServiceAttentionPanel({ reminders }: Props) {
  const { styles, theme } = useStyles(stylesheet);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reminders : reminders.slice(0, 3);

  if (!reminders.length) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.heading}>Needs attention</Text>
        </View>
        {reminders.length > 0 && (
          <Text style={styles.count}>{reminders.length}</Text>
        )}
      </View>

      <>
        {visible.map((reminder) => {
          const isOverdue = reminder.status === "overdue";
          const color = isOverdue ? theme.colors.error : theme.colors.warning;
          const due = [
            reminder.dueDate &&
              `Due ${reminder.dueDate.split("-").reverse().join("/")}`,
            reminder.dueMileage != null &&
              `${reminder.dueMileage.toLocaleString()} km`,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <TouchableOpacity
              key={reminder.logId}
              onPress={() =>
                router.push(`/logs/service/${reminder.logId}` as any)
              }
              accessibilityRole="button"
              accessibilityLabel={`${formatServiceType(reminder.serviceType)} for ${reminder.vehicleName}, ${isOverdue ? "overdue" : "due soon"}, ${due}`}
              style={styles.item}
            >
              <View style={styles.itemText}>
                <Text style={styles.vehicle}>{reminder.vehicleName}</Text>
                <Text style={styles.service}>
                  {formatServiceType(reminder.serviceType)}
                </Text>
                <Text style={styles.due}>{due}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: withOpacity(color, 0.12) },
                ]}
              >
                <Text style={[styles.badgeText, { color }]}>
                  {isOverdue ? "Overdue" : "Due soon"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {reminders.length > 3 && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            accessibilityRole="button"
            style={styles.expandButton}
          >
            <Text style={styles.link}>
              {expanded ? "Show less" : `Show ${reminders.length - 3} more`}
            </Text>
          </TouchableOpacity>
        )}
      </>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  heading: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  count: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  itemText: { flex: 1, gap: theme.spacing.xs },
  vehicle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  service: { color: theme.colors.text, fontSize: theme.fontSize.sm },
  due: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
  badge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  expandButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
}));
