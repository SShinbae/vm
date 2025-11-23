import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    yearButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    yearText: {
      fontSize: 16,
      color: value ? colors.text : colors.icon,
    },
    iconContainer: {
      marginLeft: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      width: "90%",
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
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
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.icon,
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
          <IconSymbol name="calendar" size={20} color={colors.icon} />
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
