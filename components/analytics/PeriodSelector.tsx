import { baseColors, withOpacity } from "@/src/design-system";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
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
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  periods,
  allowCustomRange = true,
  onCustomRangeSelect,
}: PeriodSelectorProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isMobile } = useResponsiveLayout();
  const [modalVisible, setModalVisible] = useState(false);
  const [dateRangePickerVisible, setDateRangePickerVisible] = useState(false);

  const iconSize = isMobile ? 18 : 20;

  const handleCustomRangeClick = () => {
    setModalVisible(false);
    setDateRangePickerVisible(true);
  };

  const handleCustomRangeConfirm = (startDate: Date, endDate: Date) => {
    if (onCustomRangeSelect) {
      onCustomRangeSelect(startDate, endDate);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isMobile && styles.containerMobile]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="calendar-outline"
          size={iconSize}
          color={theme.colors.textSecondary}
        />
        <Text
          style={[styles.selectedText, isMobile && styles.selectedTextMobile]}
        >
          {selectedPeriod.label}
        </Text>
        <Ionicons
          name="chevron-down-outline"
          size={iconSize}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={periods}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => {
                const isSelected = item.label === selectedPeriod.label;
                return (
                  <TouchableOpacity
                    style={styles.periodItem}
                    onPress={() => {
                      onPeriodChange(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.periodText}>{item.label}</Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                allowCustomRange ? (
                  <TouchableOpacity
                    style={[styles.periodItem, styles.customRangeItem]}
                    onPress={handleCustomRangeClick}
                  >
                    <View style={styles.customRangeContent}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.customRangeText}>Custom Range</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>

      <DateRangePicker
        visible={dateRangePickerVisible}
        onClose={() => setDateRangePickerVisible(false)}
        onConfirm={handleCustomRangeConfirm}
        initialStartDate={selectedPeriod.startDate}
        initialEndDate={selectedPeriod.endDate}
      />
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerMobile: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  selectedText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  selectedTextMobile: {
    fontSize: theme.fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: withOpacity(baseColors.black, 0.5),
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "60%",
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  periodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  periodText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  customRangeItem: {
    backgroundColor: theme.colors.surface,
  },
  customRangeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  customRangeText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
}));
