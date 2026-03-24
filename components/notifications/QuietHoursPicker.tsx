import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface QuietHoursPickerProps {
  startTime: string; // "HH:MM"
  endTime: string;
  selectedDays: number[]; // 0=Sun, 6=Sat
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onDaysChange: (days: number[]) => void;
}

/**
 * Time input that works across web and mobile.
 * On web, uses a native <input type="time">.
 * On mobile, shows a simple HH:MM text selector.
 */
function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (time: string) => void;
  label: string;
}) {
  const { theme } = useStyles();

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            fontSize: 14,
            width: "100%",
          }}
        />
      </View>
    );
  }

  // Mobile: simple hour picker with +/- buttons
  const [hours, minutes] = value.split(":").map(Number);

  const adjustTime = (deltaMinutes: number) => {
    let totalMinutes = hours * 60 + minutes + deltaMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.xs,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => adjustTime(-30)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
            -
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: "600",
            color: theme.colors.text,
            minWidth: 60,
            textAlign: "center",
          }}
        >
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => adjustTime(30)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function QuietHoursPicker({
  startTime,
  endTime,
  selectedDays,
  onStartTimeChange,
  onEndTimeChange,
  onDaysChange,
}: QuietHoursPickerProps) {
  const { theme } = useStyles();

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day));
    } else {
      onDaysChange([...selectedDays, day]);
    }
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {/* Time Range */}
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.lg,
          alignItems: "flex-end",
        }}
      >
        <TimeInput
          value={startTime}
          onChange={onStartTimeChange}
          label="From"
        />
        <Text
          style={{
            color: theme.colors.textSecondary,
            paddingBottom: theme.spacing.sm,
          }}
        >
          to
        </Text>
        <TimeInput value={endTime} onChange={onEndTimeChange} label="Until" />
      </View>

      {/* Day Chips */}
      <View>
        <Text
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Additional quiet days (all day)
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.sm,
          }}
        >
          {DAY_LABELS.map((label, index) => {
            const isSelected = selectedDays.includes(index);
            return (
              <TouchableOpacity
                key={index}
                onPress={() => toggleDay(index)}
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
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
