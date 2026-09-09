import { baseColors, withOpacity } from "@/src/design-system";
/**
 * Custom Date Range Picker Component
 * Allows users to select a custom start and end date for analytics
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function DateRangePicker({
  visible,
  onClose,
  onConfirm,
  initialStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  initialEndDate = new Date(),
}: DateRangePickerProps) {
  const { styles, theme } = useStyles(stylesheet);
  const [startDate, setStartDate] = useState(dayjs(initialStartDate));
  const [endDate, setEndDate] = useState(dayjs(initialEndDate));
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    // Validate dates
    if (endDate.isBefore(startDate)) {
      setError("End date must be after start date");
      return;
    }

    // Check if range is not too large (e.g., max 2 years)
    const diffInDays = endDate.diff(startDate, "days");
    if (diffInDays > 730) {
      setError("Date range cannot exceed 2 years");
      return;
    }

    if (diffInDays < 0) {
      setError("Invalid date range");
      return;
    }

    setError(null);
    onConfirm(startDate.toDate(), endDate.toDate());
    onClose();
  };

  const handleCancel = () => {
    setError(null);
    setStartDate(dayjs(initialStartDate));
    setEndDate(dayjs(initialEndDate));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Date Range</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons
                name="close-outline"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Date Selection */}
          <View style={styles.dateContainer}>
            {/* Start Date Section */}
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  mode="single"
                  date={startDate.toDate()}
                  onChange={(params: any) => {
                    if (params.date) {
                      setStartDate(dayjs(params.date));
                      setError(null);
                    }
                  }}
                />
              </View>
              <Text style={styles.selectedDateText}>
                {startDate.format("DD/MM/YYYY")}
              </Text>
            </View>

            {/* End Date Section */}
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>End Date</Text>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  mode="single"
                  date={endDate.toDate()}
                  onChange={(params: any) => {
                    if (params.date) {
                      setEndDate(dayjs(params.date));
                      setError(null);
                    }
                  }}
                />
              </View>
              <Text style={styles.selectedDateText}>
                {endDate.format("DD/MM/YYYY")}
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={theme.colors.analytics.warning}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Range: {endDate.diff(startDate, "days")} days
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: withOpacity(baseColors.black, 0.5),
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "90%",
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  dateContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  dateSection: {
    marginBottom: theme.spacing.lg,
  },
  dateLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  datePickerContainer: {
    marginBottom: theme.spacing.sm,
  },
  selectedDateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: withOpacity(theme.colors.analytics.warning, 0.12),
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.analytics.warning,
    fontWeight: theme.fontWeight.medium,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  confirmButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
}));
