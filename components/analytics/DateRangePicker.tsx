import React, { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  embedded?: boolean;
}

export function DateRangePicker({
  visible,
  onClose,
  onConfirm,
  initialStartDate,
  initialEndDate,
  embedded = false,
}: DateRangePickerProps) {
  const { theme } = useStyles();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [startDate, setStartDate] = useState(() =>
    dayjs(initialStartDate || Date.now() - 30 * 86400000),
  );
  const [endDate, setEndDate] = useState(() =>
    dayjs(initialEndDate || new Date()),
  );
  const [error, setError] = useState<string | null>(null);
  const initialStart = initialStartDate?.getTime();
  const initialEnd = initialEndDate?.getTime();
  useEffect(() => {
    if (!visible) return;
    setStartDate(dayjs(initialStart ?? Date.now() - 30 * 86400000));
    setEndDate(dayjs(initialEnd ?? new Date()));
    setError(null);
  }, [visible, initialStart, initialEnd]);

  const confirm = () => {
    if (!startDate.isValid() || !endDate.isValid()) {
      setError("Invalid date range");
      return;
    }
    if (endDate.isBefore(startDate)) {
      setError("End date must be after start date");
      return;
    }
    if (endDate.diff(startDate, "days") > 730) {
      setError("Date range cannot exceed 2 years");
      return;
    }
    setError(null);
    onConfirm(startDate.toDate(), endDate.toDate());
    onClose();
  };
  const content = (
    <ScrollView
      style={{
        maxHeight: Math.max(120, height - insets.top - insets.bottom - 96),
      }}
      contentContainerStyle={{ paddingBottom: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        accessibilityRole="header"
        style={{
          fontSize: theme.fontSize.lg,
          color: theme.colors.text,
          fontWeight: "600",
          marginBottom: 16,
        }}
      >
        Select Date Range
      </Text>
      <View>
        {(
          [
            ["Start Date", startDate, setStartDate],
            ["End Date", endDate, setEndDate],
          ] as const
        ).map(([label, date, setDate]) => (
          <View key={label} style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: theme.colors.text,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {label}
            </Text>
            <DateTimePicker
              mode="single"
              date={date.toDate()}
              onChange={(params: any) => {
                if (params.date) {
                  setDate(dayjs(params.date));
                  setError(null);
                }
              }}
              styles={{
                day_label: { color: theme.colors.text },
                weekday_label: { color: theme.colors.textSecondary },
                month_selector_label: { color: theme.colors.text },
                year_selector_label: { color: theme.colors.text },
                selected: { backgroundColor: theme.colors.primary },
                selected_label: { color: theme.colors.white },
                button_prev_image: { tintColor: theme.colors.text },
                button_next_image: { tintColor: theme.colors.text },
              }}
            />
            <Text
              style={{
                color: theme.colors.primary,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {date.format("DD/MM/YYYY")}
            </Text>
          </View>
        ))}
      </View>
      {error && (
        <Text
          accessibilityRole="alert"
          style={{ color: theme.colors.error, marginVertical: 12 }}
        >
          {error}
        </Text>
      )}
      <Text style={{ color: theme.colors.textSecondary, marginVertical: 12 }}>
        Range: {endDate.diff(startDate, "days")} days
      </Text>
      <View style={{ flexDirection: width < 360 ? "column" : "row", gap: 12 }}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={{ flex: width < 360 ? undefined : 1, minHeight: 48 }}
        />
        <Button
          title="Confirm"
          onPress={confirm}
          style={{ flex: width < 360 ? undefined : 1, minHeight: 48 }}
        />
      </View>
    </ScrollView>
  );
  if (embedded) return visible ? content : null;
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showCloseButton={false}
      contentStyle={{
        maxHeight: height - insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {content}
    </Modal>
  );
}
