import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import type { ThemeColors } from "@/src/design-system";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { IconSymbol } from "./icon-symbol";

// Wrapper component that manages its own state to prevent parent re-renders from resetting month
function StableDateTimePicker({
  initialDate,
  onDateSelect,
  colors,
}: {
  initialDate: Date;
  onDateSelect: (date: Date) => void;
  colors: ThemeColors;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const handleChange = (params: any) => {
    if (params.date) {
      // Ensure we have a proper Date object
      const dateValue =
        params.date instanceof Date ? params.date : new Date(params.date);
      setSelectedDate(dateValue);
      onDateSelect(dateValue);
    }
  };

  return (
    <DateTimePicker
      mode="single"
      date={selectedDate}
      onChange={handleChange}
      styles={{
        // Selected day styling
        selected: {
          backgroundColor: colors.primary,
          borderRadius: 20,
        },
        selected_label: {
          color: colors.white,
          fontWeight: "bold",
        },
        // Today styling
        today: {
          borderWidth: 1,
          borderColor: colors.primary,
          borderRadius: 20,
        },
        today_label: {
          color: colors.primary,
        },
        // Day cells
        day: {
          borderRadius: 20,
        },
        day_label: {
          color: colors.text,
        },
        // Outside days (previous/next month)
        outside_label: {
          color: withOpacity(colors.textSecondary, 0.31),
        },
        // Header styling
        header: {
          marginBottom: spacing.sm,
        },
        month_selector_label: {
          color: colors.text,
          fontWeight: "600",
        },
        year_selector_label: {
          color: colors.text,
          fontWeight: "600",
        },
        // Weekday header
        weekday_label: {
          color: colors.textSecondary,
        },
        // Navigation buttons
        button_prev_image: {
          tintColor: colors.text,
        },
        button_next_image: {
          tintColor: colors.text,
        },
      }}
    />
  );
}

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: any;
}

export function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = "Select date",
  required = false,
  style,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  // Track the temporarily selected date (before confirmation)
  const [tempSelectedDate, setTempSelectedDate] = useState<dayjs.Dayjs | null>(
    null,
  );
  // Key to reset DateTimePicker only when modal opens (prevents re-render resets)
  const [pickerKey, setPickerKey] = useState(0);
  const { theme } = useStyles();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallScreen = screenWidth < 380;

  const parseDate = (dateString: string): dayjs.Dayjs => {
    if (!dateString) return dayjs();

    // Handle different date formats
    if (dateString.includes("/")) {
      // DD/MM/YYYY format
      const [day, month, year] = dateString.split("/");
      return dayjs(`${year}-${month}-${day}`);
    } else if (dateString.includes("-")) {
      // YYYY-MM-DD format (database format)
      return dayjs(dateString);
    }

    return dayjs();
  };

  const formatDate = (date: dayjs.Dayjs): string => {
    // Return YYYY-MM-DD format for compatibility with existing system
    return date.format("YYYY-MM-DD");
  };

  const formatDisplayDate = (date: dayjs.Dayjs): string => {
    // Display format DD/MM/YYYY for better UX
    return date.format("DD/MM/YYYY");
  };

  // Handle date selection from the stable picker
  const handleDateSelect = useCallback((date: Date) => {
    setTempSelectedDate(dayjs(date));
  }, []);

  // Confirm the selected date and close picker
  const handleConfirm = () => {
    if (tempSelectedDate) {
      const formattedDate = formatDate(tempSelectedDate);
      onDateChange(formattedDate);
    }
    setShowPicker(false);
  };

  // Cancel and close picker without saving
  const handleCancel = () => {
    setTempSelectedDate(null);
    setShowPicker(false);
  };

  // Initialize temp date when picker opens
  const handleOpenPicker = () => {
    const initialDate = value ? parseDate(value) : dayjs();
    setTempSelectedDate(initialDate);
    setPickerKey((prev) => prev + 1); // New key = fresh DateTimePicker instance
    setShowPicker(true);
  };

  const displayValue = value
    ? formatDisplayDate(parseDate(value))
    : placeholder;

  const styles = StyleSheet.create({
    container: {
      marginBottom: isSmallScreen ? 16 : 20,
    },
    label: {
      fontSize: isSmallScreen ? 13 : 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: isSmallScreen ? 6 : 8,
    },
    requiredLabel: {
      color: theme.colors.error,
    },
    dateButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      borderRadius: 8,
      paddingHorizontal: isSmallScreen ? 10 : 16,
      paddingVertical: isSmallScreen ? 10 : 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: isSmallScreen ? 44 : 48,
    },
    dateText: {
      fontSize: isSmallScreen ? 13 : 16,
      color: value ? colors.text : colors.textSecondary,
      flex: 1,
    },
    iconContainer: {
      marginLeft: isSmallScreen ? 6 : 12,
      flexShrink: 0,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: withOpacity(baseColors.black, 0.5),
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: isSmallScreen ? 16 : 20,
      width: "90%",
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: spacing.xs,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: withOpacity(colors.textSecondary, 0.12),
    },
    cancelButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 8,
      backgroundColor: withOpacity(colors.textSecondary, 0.08),
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    confirmButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.white,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.requiredLabel}>*</Text>}
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{displayValue}</Text>
        <View style={styles.iconContainer}>
          <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e: any) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <StableDateTimePicker
                key={pickerKey}
                initialDate={tempSelectedDate?.toDate() ?? dayjs().toDate()}
                onDateSelect={handleDateSelect}
                colors={colors}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
