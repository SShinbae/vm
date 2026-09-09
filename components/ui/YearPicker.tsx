import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "react-native-ui-datepicker";
import { IconSymbol } from "./icon-symbol";

interface YearPickerProps {
  label: string;
  value: string;
  onYearChange: (year: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: any;
}

export function YearPicker({
  label,
  value,
  onYearChange,
  placeholder = "Select year",
  required = false,
  style,
}: YearPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;

  const handleDateChange = (params: any) => {
    const selectedDate = params.date;
    if (selectedDate) {
      const year = dayjs(selectedDate).format("YYYY");
      onYearChange(year);
      setShowPicker(false);
    }
  };

  const currentDate = value ? dayjs(`${value}-01-01`) : dayjs();
  const displayValue = value || placeholder;

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    requiredLabel: {
      color: theme.colors.error,
    },
    yearButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      borderRadius: 8,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    yearText: {
      fontSize: 16,
      color: value ? colors.text : colors.textSecondary,
    },
    iconContainer: {
      marginLeft: spacing.md,
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
      padding: spacing.xl,
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
      fontSize: 18,
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
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.requiredLabel}>*</Text>}
      </Text>

      <TouchableOpacity
        style={styles.yearButton}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.yearText}>{displayValue}</Text>
        <View style={styles.iconContainer}>
          <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Year</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                mode="single"
                date={currentDate.toDate()}
                onChange={handleDateChange}
                timePicker={false}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
