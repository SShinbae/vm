import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/lib/utils/dateUtils";
import { ActionMenu } from "@/components/ui/ActionMenu";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { AnalyticsPeriod } from "../../types/analytics";
import { DateRangePicker } from "./DateRangePicker";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

interface PeriodSelectorProps {
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  periods: AnalyticsPeriod[];
  allowCustomRange?: boolean;
  onCustomRangeSelect?: (startDate: Date, endDate: Date) => void;
  placement?: "inline" | "toolbar";
  compact?: boolean;
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  periods,
  allowCustomRange = true,
  onCustomRangeSelect,
  placement = "inline",
  compact = false,
}: PeriodSelectorProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isWeb, isMobile } = useResponsiveLayout();
  const [modalVisible, setModalVisible] = useState(false);
  const [dateRangePickerVisible, setDateRangePickerVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const handleCustomRangeClick = () => {
    setDateRangePickerVisible(true);
  };
  const close = () => {
    setModalVisible(false);
    setDateRangePickerVisible(false);
  };
  const handleCustomRangeConfirm = (startDate: Date, endDate: Date) => {
    if (onCustomRangeSelect) onCustomRangeSelect(startDate, endDate);
    else
      onPeriodChange({
        label: `${formatDate(startDate)} – ${formatDate(endDate)}`,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
        startDate,
        endDate,
      });
    close();
  };

  if (isWeb && !isMobile)
    return placement === "toolbar" ? (
      <View style={{ alignSelf: "flex-start" }}>
        <ActionMenu
          label={selectedPeriod.label}
          items={[
            ...periods.map((period) => ({
              label: period.label,
              icon: "calendar",
              onPress: () => onPeriodChange(period),
            })),
            ...(allowCustomRange
              ? [
                  {
                    label: "Custom Range",
                    icon: "calendar",
                    onPress: handleCustomRangeClick,
                  },
                ]
              : []),
          ]}
        />
        <DateRangePicker
          visible={dateRangePickerVisible}
          onClose={() => setDateRangePickerVisible(false)}
          onConfirm={handleCustomRangeConfirm}
          initialStartDate={selectedPeriod.startDate}
          initialEndDate={selectedPeriod.endDate}
        />
      </View>
    ) : null;

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Select analytics period"
        accessibilityValue={{ text: selectedPeriod.label }}
        accessibilityState={{ expanded: modalVisible }}
        style={[
          styles.container,
          compact && { minHeight: 56, flexGrow: 1, gap: 6, marginBottom: 0 },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="calendar-outline"
          size={compact ? 18 : 22}
          color={theme.colors.textSecondary}
        />
        <Text
          numberOfLines={compact ? 2 : undefined}
          style={styles.selectedText}
        >
          {compact && !periods.some((p) => p.label === selectedPeriod.label)
            ? "Custom dates"
            : selectedPeriod.label}
        </Text>
        <Ionicons
          name="chevron-down-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      <Modal
        visible={modalVisible || dateRangePickerVisible}
        onClose={close}
        variant="bottom-sheet"
        showCloseButton={false}
        contentStyle={{
          maxHeight: height - insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {dateRangePickerVisible ? (
          <DateRangePicker
            visible
            onClose={close}
            onConfirm={handleCustomRangeConfirm}
            initialStartDate={selectedPeriod.startDate}
            initialEndDate={selectedPeriod.endDate}
            embedded
          />
        ) : (
          <ScrollView
            style={{
              maxHeight: Math.max(
                120,
                height - insets.top - insets.bottom - 96,
              ),
            }}
          >
            <Text accessibilityRole="header" style={styles.title}>
              Select period
            </Text>
            <View>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.label}
                  accessibilityRole="button"
                  accessibilityLabel={period.label}
                  accessibilityState={{
                    selected: period.label === selectedPeriod.label,
                  }}
                  style={styles.option}
                  onPress={() => {
                    onPeriodChange(period);
                    close();
                  }}
                >
                  <Text style={styles.selectedText}>{period.label}</Text>
                  {period.label === selectedPeriod.label && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
              {allowCustomRange && (
                <Button
                  title="Custom Range"
                  variant="outline"
                  onPress={handleCustomRangeClick}
                  style={{ minHeight: 48, marginTop: 12 }}
                />
              )}
            </View>
            <Button
              title="Cancel"
              variant="outline"
              onPress={close}
              style={{ minHeight: 48, marginTop: 16 }}
            />
          </ScrollView>
        )}
      </Modal>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 12,
  },
  selectedText: {
    flex: 1,
    minWidth: 0,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    marginBottom: 16,
  },
  option: {
    minHeight: 48,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
}));
