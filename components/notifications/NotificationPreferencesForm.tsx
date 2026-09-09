import { withOpacity, spacing } from "@/src/design-system";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { notificationPreferencesDefaultValues } from "@/src/shared/schemas/notificationPreferencesSchema";
import { QuietHoursPicker } from "./QuietHoursPicker";
import { Database } from "@/types/database";

type Update =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

const REMINDER_DAY_OPTIONS = [30, 7, 3, 1];
const MILEAGE_THRESHOLD_OPTIONS = [5000, 1000, 500];
const FREQUENCY_OPTIONS = [
  { label: "Weekly", value: "weekly" as const },
  { label: "Monthly", value: "monthly" as const },
  { label: "Never", value: "never" as const },
];

export function NotificationPreferencesForm() {
  const { theme } = useStyles();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: prefs, isLoading } = useNotificationPreferences(userId);
  const { mutate: updatePrefs } = useUpdateNotificationPreferences();

  // Debounce timer for auto-save
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(
    (data: Partial<Update>) => {
      if (!userId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updatePrefs({ userId, data });
      }, 500);
    },
    [userId, updatePrefs],
  );

  const immediateUpdate = useCallback(
    (data: Partial<Update>) => {
      if (!userId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updatePrefs({ userId, data });
    },
    [userId, updatePrefs],
  );

  // Merge DB prefs with defaults
  const defaults = notificationPreferencesDefaultValues;
  const p = {
    ...defaults,
    ...prefs,
  };

  if (isLoading) {
    return (
      <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const NotificationSwitch = ({
    label,
    value,
    field,
    description,
  }: {
    label: string;
    value: boolean;
    field: keyof Update;
    description?: string;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: theme.spacing.md }}>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.text,
            fontWeight: theme.fontWeight.medium,
          }}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(val) => immediateUpdate({ [field]: val })}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? "white" : theme.colors.textSecondary}
      />
    </View>
  );

  const ChipSelect = ({
    options,
    selected,
    onToggle,
    formatLabel,
  }: {
    options: number[];
    selected: number[];
    onToggle: (val: number[]) => void;
    formatLabel?: (val: number) => string;
  }) => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
      }}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => {
              const next = isSelected
                ? selected.filter((s) => s !== opt)
                : [...selected, opt].sort((a, b) => b - a);
              onToggle(next);
            }}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: isSelected
                ? theme.colors.primary
                : theme.colors.surface,
              borderWidth: 1,
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                fontWeight: "500",
                color: isSelected ? "white" : theme.colors.text,
              }}
            >
              {formatLabel ? formatLabel(opt) : String(opt)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={{
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
      }}
    >
      {title}
    </Text>
  );

  const Section = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        marginHorizontal: theme.spacing.lg,
      }}
    >
      {children}
    </View>
  );

  return (
    <>
      {/* Activity Notifications */}
      <Section>
        <SectionHeader title="Activity Notifications" />
        <NotificationSwitch
          label="Log Updates"
          description="Fuel, mileage, and service log changes"
          value={p.log_updates_enabled}
          field="log_updates_enabled"
        />
        <NotificationSwitch
          label="Group Members"
          description="When members join or leave groups"
          value={p.group_members_enabled}
          field="group_members_enabled"
        />
        <NotificationSwitch
          label="Invitations"
          description="Group invitation notifications"
          value={p.invitations_enabled}
          field="invitations_enabled"
        />
      </Section>

      {/* Service Reminders */}
      <Section>
        <SectionHeader title="Service Reminders" />
        <NotificationSwitch
          label="Enable Service Reminders"
          description="Get notified before services are due"
          value={p.service_reminders_enabled}
          field="service_reminders_enabled"
        />
        {p.service_reminders_enabled && (
          <View style={{ marginTop: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Remind me before due date
            </Text>
            <ChipSelect
              options={REMINDER_DAY_OPTIONS}
              selected={p.service_reminder_days}
              onToggle={(days) =>
                debouncedUpdate({ service_reminder_days: days })
              }
              formatLabel={(d) => (d === 1 ? "1 day" : `${d} days`)}
            />
          </View>
        )}
      </Section>

      {/* Mileage Reminders */}
      <Section>
        <SectionHeader title="Mileage Reminders" />
        <NotificationSwitch
          label="Enable Mileage Reminders"
          description="Get notified at mileage thresholds"
          value={p.mileage_reminders_enabled}
          field="mileage_reminders_enabled"
        />
        {p.mileage_reminders_enabled && (
          <View style={{ marginTop: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Remind me at these km thresholds
            </Text>
            <ChipSelect
              options={MILEAGE_THRESHOLD_OPTIONS}
              selected={p.mileage_reminder_thresholds}
              onToggle={(thresholds) =>
                debouncedUpdate({ mileage_reminder_thresholds: thresholds })
              }
              formatLabel={(v) => `${v.toLocaleString()} km`}
            />
          </View>
        )}
      </Section>

      {/* Cost Alerts */}
      <Section>
        <SectionHeader title="Cost Alerts" />
        <NotificationSwitch
          label="Enable Cost Alerts"
          description="Monthly spending and fuel price alerts"
          value={p.cost_alerts_enabled}
          field="cost_alerts_enabled"
        />
        {p.cost_alerts_enabled && (
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
            <View>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Monthly spending threshold
              </Text>
              <TextInput
                value={
                  p.monthly_spending_threshold != null
                    ? String(p.monthly_spending_threshold)
                    : ""
                }
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  debouncedUpdate({
                    monthly_spending_threshold: isNaN(num) ? null : num,
                  });
                }}
                placeholder="No limit set"
                keyboardType="numeric"
                style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                Fuel price alert: notify when {p.fuel_price_alert_percentage}%
                above average
              </Text>
            </View>
          </View>
        )}
      </Section>

      {/* Analytics Insights */}
      <Section>
        <SectionHeader title="Analytics Insights" />
        <NotificationSwitch
          label="Enable Analytics Insights"
          description="Fuel efficiency trends and cost summaries"
          value={p.analytics_insights_enabled}
          field="analytics_insights_enabled"
        />
        {p.analytics_insights_enabled && (
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
            }}
          >
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = p.analytics_frequency === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() =>
                    immediateUpdate({ analytics_frequency: opt.value })
                  }
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      fontWeight: "500",
                      color: isSelected ? "white" : theme.colors.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Section>

      {/* Delivery */}
      <Section>
        <SectionHeader title="Delivery" />
        <NotificationSwitch
          label="Push Notifications"
          description="Receive push notifications on your device"
          value={p.push_notifications_enabled}
          field="push_notifications_enabled"
        />
        <NotificationSwitch
          label="In-App Toasts"
          description="Show toast messages inside the app"
          value={p.in_app_toasts_enabled}
          field="in_app_toasts_enabled"
        />
      </Section>

      {/* Quiet Hours */}
      <Section>
        <SectionHeader title="Quiet Hours" />
        <NotificationSwitch
          label="Enable Quiet Hours"
          description="Suppress push notifications during set times"
          value={p.quiet_hours_enabled}
          field="quiet_hours_enabled"
        />
        {p.quiet_hours_enabled && (
          <View style={{ marginTop: theme.spacing.md }}>
            <QuietHoursPicker
              startTime={p.quiet_hours_start}
              endTime={p.quiet_hours_end}
              selectedDays={p.quiet_days}
              onStartTimeChange={(time) =>
                debouncedUpdate({ quiet_hours_start: time })
              }
              onEndTimeChange={(time) =>
                debouncedUpdate({ quiet_hours_end: time })
              }
              onDaysChange={(days) => debouncedUpdate({ quiet_days: days })}
            />
          </View>
        )}
      </Section>

      {/* Frequency Limit */}
      <Section>
        <SectionHeader title="Frequency Limit" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.text,
              flex: 1,
            }}
          >
            Max notifications per type per day
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                const next = Math.max(1, p.max_per_type_per_day - 1);
                immediateUpdate({ max_per_type_per_day: next });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: withOpacity(theme.colors.primary, 0.08),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: "600",
                }}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: "700",
                color: theme.colors.text,
                minWidth: 30,
                textAlign: "center",
              }}
            >
              {p.max_per_type_per_day}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const next = Math.min(50, p.max_per_type_per_day + 1);
                immediateUpdate({ max_per_type_per_day: next });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: withOpacity(theme.colors.primary, 0.08),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: "600",
                }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Section>
    </>
  );
}
